# Hydrogen Storage Facility Monitoring & Safety Management System
## Architecture, File Directory & Operational Documentation

---

### 1. System Overview
The **Hydrogen Storage Safety System** is an industrial safety operating system for high-pressure cryogenic and compressed hydrogen storage tanks (Type IV composite vessels, up to 700 bar). It complies with **NFPA 2 (Hydrogen Technologies Code)** and **ISO 19880-1 (Gaseous Hydrogen Fueling Stations)**.

The system continuously samples:
- **Pressure** (bar): High alarm at 720 bar, Emergency shutdown (ESD) venting at 750 bar.
- **Temperature** (°C): Cryogenic to thermal runaway thresholds (-40°C to +85°C).
- **Hydrogen Concentration** (% LEL): Lower Explosive Limit tracking (Warning at 10% LEL, Emergency Vent & Deluge at 25% LEL).
- **Sensor Health Index** (%): Drift detection, heartbeat timeout, and signal-to-noise ratio.

---

### 2. Directory Structure & File Map

```
hydrogen-storage-safety-system/
├── docker-compose.yml              # Multi-container orchestration (Mongo, Server, Client)
├── README.md                       # Quickstart and overview
├── docs/                           # System architecture & deployment manuals
│   ├── ARCHITECTURE.md             # This document
│   └── RUNBOOK.md                  # Step-by-step verification and emergency procedure
├── client/                         # React 18 + Vite Frontend Application
│   ├── Dockerfile                  # Multi-stage build (Node 20 build -> Nginx Alpine runtime)
│   ├── nginx.conf                  # Nginx configuration with API reverse proxy to backend
│   ├── package.json                # Frontend dependencies (Lucide icons, Socket.IO client)
│   ├── vite.config.js              # Vite bundler configuration & local dev proxy
│   ├── index.html                  # HTML entry point with Inter & JetBrains Mono typography
│   └── src/
│       ├── App.jsx                 # Main application dashboard, tabs, real-time alerts & modals
│       ├── index.css               # Anti-slop STRATIS-inspired clean enterprise light design system
│       ├── main.jsx                # React root mount
│       └── mockData.js             # Fallback telemetry data for offline/standalone execution
└── server/                         # Express & Mongoose API Server
    ├── Dockerfile                  # Production Node.js 20 Alpine container
    ├── package.json                # Backend dependencies (express, mongoose, socket.io, cors)
    ├── server.js                   # Express server, REST endpoints, WebSocket telemetry loop
    └── seeder.js                   # Realistic industrial facility dataset & threshold generator
```

---

### 3. Detailed Component Breakdown

#### Backend (`server/`)
- **`server/server.js`**:
  - Initializes Express REST API and Socket.IO server.
  - Connects to MongoDB with retry logic.
  - Implements background telemetry simulator (`emitTelemetryUpdate`) running on a 2-second heartbeat to emulate real sensor updates across 4 active storage tanks (`TK-101`, `TK-102`, `TK-103`, `TK-104`).
  - Evaluates live readings against `SafetyThreshold` definitions; automatically issues high-priority `SafetyAlert` documents when limits are breached.
  - Endpoints:
    - `GET /health`: Docker healthcheck.
    - `GET /api/overview`: KPI counters, safety index, active alert badges, ESD status.
    - `GET /api/vessels`: Current pressure, temperature, LEL, and valve positions for each vessel.
    - `GET /api/telemetry/history`: Time-series sensor log.
    - `GET /api/alerts`: Real-time active and resolved safety alerts.
    - `POST /api/thresholds`: Update operating limits dynamically.
    - `POST /api/actuators/emergency-vent`: Manual override triggering solenoid vent valves.
    - `GET /api/compliance`: NFPA 2 & ISO 19880 audit logs.
- **`server/seeder.js`**:
  - Seeds initial hydrogen vessels, default pressure/temperature safety envelopes, initial maintenance logs, and compliance records on first boot.

#### Frontend (`client/`)
- **`client/src/App.jsx`**:
  - Built with clean enterprise UI (STRATIS-inspired, light neutral slate background `#F8FAFC`, dark navy header `#0F172A`, high-contrast emerald/amber/crimson telemetry badges).
  - Navigation tabs:
    1. **Live Facility Dashboard**: Real-time facility safety index (98.4%), active vessel matrix, LEL warning indicators, and quick ESD triggers.
    2. **Vessel Matrix**: Detailed Type-IV tank schematics, valve states (Inlet/Outlet/Vent), and burst disc indicators.
    3. **Telemetry & Sensor Log**: Real-time chart/tabular streaming feed.
    4. **Thresholds & Safety Envelopes**: Modal to adjust max allowable working pressure (MAWP) and emergency thresholds.
    5. **Maintenance & Inspections**: Acoustic emission and ultrasonic testing schedule.
    6. **Regulatory Compliance**: NFPA 2 Hydrogen Code checklist and audit export.
- **`client/nginx.conf`**:
  - Serves static compiled client on port `80`.
  - Proxies `/api/` to `http://server:5000/api/` and WebSocket `/socket.io/` to backend seamlessly.

---

### 4. Zero-Dependency Execution via Docker

To run on **any other computer** with Docker Desktop:
```bash
# 1. Unzip the project folder on the target laptop
cd hydrogen-storage-safety-system

# 2. Start all 3 containers (MongoDB + Node API + Nginx Client)
docker compose up --build -d

# 3. Access in browser:
# Frontend Dashboard: http://localhost:3000
# Backend Healthcheck: http://localhost:5000/health
# API Overview:       http://localhost:5000/api/overview
```
No global Node, npm, or Mongo installations required.
