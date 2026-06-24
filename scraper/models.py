"""
Database schema setup for Christoph 47 tracker.
Uses TimescaleDB hypertable for time-series flight positions.
"""

CREATE_EXTENSION = "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"

CREATE_FLIGHTS_TABLE = """
CREATE TABLE IF NOT EXISTS flight_positions (
    time            TIMESTAMPTZ     NOT NULL,
    icao_hex        VARCHAR(6)      NOT NULL,
    callsign        VARCHAR(20),
    lat             DOUBLE PRECISION,
    lon             DOUBLE PRECISION,
    altitude_ft     INTEGER,
    altitude_geom   INTEGER,
    ground_speed_kt REAL,
    track_deg       REAL,
    vertical_rate   INTEGER,
    squawk          VARCHAR(4),
    aircraft_type   VARCHAR(10),
    registration    VARCHAR(12),
    flight          VARCHAR(20),
    on_ground       BOOLEAN         NOT NULL DEFAULT FALSE,
    emergency       VARCHAR(20),
    category        VARCHAR(4),
    messages        INTEGER,
    seen            REAL,
    rssi            REAL
);
"""

CREATE_HYPERTABLE = """
SELECT create_hypertable(
    'flight_positions', 'time',
    if_not_exists => TRUE
);
"""

CREATE_INDEX_ICAO = """
CREATE INDEX IF NOT EXISTS idx_fp_icao ON flight_positions (icao_hex, time DESC);
"""

CREATE_INDEX_CALLSIGN = """
CREATE INDEX IF NOT EXISTS idx_fp_callsign ON flight_positions (callsign, time DESC);
"""

CREATE_AIRCRAFT_CACHE = """
CREATE TABLE IF NOT EXISTS known_aircraft (
    icao_hex        VARCHAR(6)      PRIMARY KEY,
    callsign        VARCHAR(20),
    registration    VARCHAR(12),
    aircraft_type   VARCHAR(10),
    operator        VARCHAR(60),
    first_seen      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_seen       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
"""

INSERT_POSITION = """
INSERT INTO flight_positions (
    time, icao_hex, callsign, lat, lon,
    altitude_ft, altitude_geom, ground_speed_kt, track_deg, vertical_rate,
    squawk, aircraft_type, registration, flight,
    on_ground, emergency, category, messages, seen, rssi
) VALUES (
    %(time)s, %(icao_hex)s, %(callsign)s, %(lat)s, %(lon)s,
    %(altitude_ft)s, %(altitude_geom)s, %(ground_speed_kt)s, %(track_deg)s, %(vertical_rate)s,
    %(squawk)s, %(aircraft_type)s, %(registration)s, %(flight)s,
    %(on_ground)s, %(emergency)s, %(category)s, %(messages)s, %(seen)s, %(rssi)s
);
"""

UPSERT_AIRCRAFT = """
INSERT INTO known_aircraft (icao_hex, callsign, registration, aircraft_type, last_seen)
VALUES (%(icao_hex)s, %(callsign)s, %(registration)s, %(aircraft_type)s, NOW())
ON CONFLICT (icao_hex) DO UPDATE SET
    callsign     = EXCLUDED.callsign,
    registration = EXCLUDED.registration,
    aircraft_type = EXCLUDED.aircraft_type,
    last_seen    = NOW();
"""
