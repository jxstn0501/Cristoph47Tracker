# Christoph 47 Tracker

ADS-B scraper and analytics backend for the rescue helicopter **Christoph 47** (CHX47) based in Greifswald.

## Architecture

```
globe.adsbexchange.com  →  Python Scraper  →  TimescaleDB  →  FastAPI Analytics
```

## Quick Start

```bash
# Start database + scraper
docker compose up -d

# Start analytics API (optional)
cd analytics
pip install -r requirements.txt
uvicorn api:app --reload
```

## Analytics API Endpoints

| Endpoint | Description |
|---|---|
| `GET /flights/live` | Most recent position |
| `GET /flights/track?hours=24` | Position track (last N hours) |
| `GET /flights/missions?days=30` | Detected individual missions |
| `GET /stats/daily?days=30` | Daily aggregated stats |
| `GET /stats/summary` | Overall summary |
| `GET /aircraft` | Known ICAO identities |

## Configuration

Environment variables for the scraper:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | local postgres | PostgreSQL connection string |
| `POLL_INTERVAL` | `8` | Seconds between polls |
| `CALLSIGN_FILTER` | `CHRISTOPH47` | Comma-separated callsigns to track |

## Data Schema

The `flight_positions` table is a TimescaleDB hypertable with automatic time-series
partitioning. Each row stores one position report with full ADS-B telemetry.

Fields: `time, icao_hex, callsign, lat, lon, altitude_ft, altitude_geom,
ground_speed_kt, track_deg, vertical_rate, squawk, aircraft_type,
registration, on_ground, emergency, category, messages, seen, rssi`
