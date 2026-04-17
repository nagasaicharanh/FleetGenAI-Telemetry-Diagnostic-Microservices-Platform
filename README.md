# FleetGenAI Telemetry & Diagnostic Microservices Platform

FleetGenAI is a technical prototype showing real-time telemetry ingestion, anomaly detection, and GenAI-assisted diagnostics across containerized microservices.

## Tech Stack

| Layer | Tools |
|---|---|
| Message broker/state | Redis (Pub/Sub + Hash/List) |
| Ingestion gateway | Node.js, TypeScript, Express, ioredis |
| AI diagnostics worker | Python 3.11, FastAPI, redis-py, LangChain PromptTemplate, Groq (Llama 3) |
| Frontend dashboard | React, TypeScript, Vite, TailwindCSS, Recharts |
| Orchestration | Docker, Docker Compose |

## Architecture

1. `gateway` simulates telemetry for 5 vehicles every second and publishes payloads to `telemetry_stream`.
2. `ai-worker` subscribes to telemetry, filters anomalies (`P0217` or `engineTemp > 115`), calls Groq, and stores diagnostics in Redis.
3. `dashboard` polls `gateway` REST APIs for latest fleet state, history, and GenAI alert feed.

Add your architecture image at `docs/architecture-diagram.png` (draw.io or Excalidraw export).

## API Contract (Gateway)

- `GET /health`
- `GET /api/vehicles`
- `GET /api/vehicles/:vin/history?limit=60`
- `GET /api/diagnostics?limit=20`

## Local Run

1. Copy env file and set your Groq key:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Edit `.env` and set `GROQ_API_KEY`.
3. Start all services:
   ```powershell
   docker compose up --build
   ```
4. Open:
   - Dashboard: `http://localhost:5173`
   - Gateway health: `http://localhost:3000/health`
   - AI worker health: `http://localhost:8000/health` (only if mapped manually or queried in container network)

## Feature Mapping

- **TypeScript**: gateway + dashboard
- **Python / GenAI**: AI worker with Llama 3 diagnostics
- **Docker**: full platform starts with one compose command
- **Data pipeline**: Redis telemetry stream and diagnostics persistence
- **Prototype quality**: live chart + alert feed with anomaly-to-insight flow
