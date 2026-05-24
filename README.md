# API Failure Detection & Root Cause Analyzer

A production-grade, real-time API failure detection and AI-powered root cause analysis system built for hackathon demo. Features a professional dark-themed dashboard with WebSocket live updates, anomaly detection, synthetic data generation, and comprehensive debugging guides.

## Features

- **Real-time Dashboard** - Live metrics, error rate charts, service health overview
- **Anomaly Detection** - Automatic detection of error rate spikes, latency degradation, and traffic anomalies
- **AI Root Cause Analysis** - Intelligent analysis with confidence scoring, probable causes, and remediation actions
- **Live Alerts** - Real-time alert feed with severity classification and acknowledgment workflow
- **Trends & Analytics** - Historical data visualization with multiple chart types
- **Debug Guide** - Step-by-step debugging instructions with copyable commands
- **Log Explorer** - Full-text search, filtering, and manual log ingestion
- **Settings** - Configurable thresholds, retention policies, and auto-analysis toggle
- **WebSocket** - Real-time updates pushed to all connected clients

## Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Recharts for data visualization
- Lucide icons
- date-fns for time formatting

**Backend:**
- Node.js + Express (ESM)
- WebSocket (ws library)
- In-memory data store with retention
- Anomaly detection engine
- AI analysis simulator
- Synthetic log generator

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Install dependencies
npm install

# Start both backend and frontend (development)
npm run dev

# Or start separately
npm run server      # Backend on port 5001
npm run dev:client  # Frontend on port 5173
```

### Access the Application

- **Dashboard:** http://localhost:5173
- **API Base:** http://localhost:5001/api
- **WebSocket:** ws://localhost:5001/ws

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/logs | Ingest logs (single or batch) |
| GET | /api/logs | Query logs with filters |
| POST | /api/logs/generate | Generate synthetic logs |
| GET | /api/alerts | Get alerts with filtering |
| POST | /api/alerts/:id/resolve | Resolve alert |
| GET | /api/analysis | Get all analyses |
| POST | /api/analysis/:alertId | Trigger AI analysis |
| GET | /api/analysis/:alertId/debug | Get debug steps |
| GET | /api/trends | Get trend data |
| GET | /api/metrics | Get current metrics |
| GET | /api/metrics/config | Get configuration |
| PUT | /api/metrics/config | Update configuration |
| GET | /api/health | Health check |
| WS | /ws | WebSocket for live updates |

## Architecture

```
+---------------+       WebSocket        +-------------------+
|   React UI    |<---------------------->|  Express Backend  |
|  (Port 5173)  |                       |   (Port 5001)     |
+---------------+                       +-------------------+
      |                                           |
      | HTTP API                                  |
      |                                           |
      v                                           v
+---------------+                       +-------------------+
|  Recharts     |                       | Anomaly Detector  |
|  Dashboard    |                       |   (30s interval)  |
+---------------+                       +-------------------+
                                                 |
                                                 v
                                        +-------------------+
                                        |   AI Analyzer     |
                                        | (knowledge base)  |
                                        +-------------------+
                                                 |
                                                 v
                                        +-------------------+
                                        |  Log Generator    |
                                        |  (continuous)     |
                                        +-------------------+
```

## Judging Pitch (60 Seconds)

"Silent API failures cost engineering teams thousands per minute. When APIs fail, developers waste 30+ minutes searching logs. By then, customers have already experienced downtime.

Our solution: An AI-powered agent that instantly detects API failures, identifies what broke using intelligent analysis, and tells engineers exactly how to fix it in under 2 minutes.

MTTR: 30 minutes → 2 minutes. Zero customer impact. Works with any API infrastructure.

Watch: API fails → Dashboard detects it → AI explains it → Engineers fix it. All in minutes instead of hours."

## Development

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run backend with auto-reload
npm run server:watch
```

## License

MIT
