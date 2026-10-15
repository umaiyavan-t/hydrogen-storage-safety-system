# Hydrogen Storage Facility Monitoring & Safety Instrumented Supervisory System

An Industrial SCADA/HMI Platform for High-Pressure Gaseous and Cryogenic Liquid Hydrogen Storage Enclosures

---

## Abstract

Hydrogen gas represents a key clean energy vector for heavy transport and decarbonized industrial manufacturing. However, its physical characteristics present unique process safety challenges: an exceptionally wide flammability range (4.0% to 75.0% by volume in air), minimal ignition energy requirements (0.017 mJ), susceptibility to high-pressure mechanical embrittlement, and rapid dispersion dynamics. Unmitigated vessel wall fatigue, seal degradation, or pressure spikes in high-pressure Type IV composite cylinders (up to 700 bar) or cryogenic vacuum-insulated vessels (-253 degrees Celsius) present catastrophic risks of BLEVE (Boiling Liquid Expanding Vapor Explosion) and deflagration.

This repository implements an industrial Supervisory Control and Data Acquisition (SCADA) and Human-Machine Interface (HMI) web system designed for stationary hydrogen storage pads and dispenser manifolds. The platform provides continuous telemetry monitoring, role-based access control (RVAC), ISA-18.2 compliant alarm rationalization, automated audit trail logging, and emergency relief valve actuation interfaces compliant with NFPA 2 (Hydrogen Technologies Code), ISO 19880-1, and OSHA 1910.103.

---

## System Architecture

The software architecture operates across three distinct operational layers:

```
[Layer 1: Sensor & Actuator Interface]
  - High-Pressure Piezoelectric Transmitters (0 - 1000 bar)
  - Cryogenic RTDs & Platinum Resistance Thermometers (-260 to +100 deg C)
  - Catalytic Bead & Optical Hydrogen Gas Detectors (0 - 40,000 ppm / 100% LEL)
  - Pneumatic Fail-Safe Solenoid Relief Vent Valves
                          |
                          v
[Layer 2: Real-Time Ingestion & Processing Tier (Node.js / Express)]
  - WebSocket (Socket.IO) Event Broadcasting (Heartbeat Cadence: 3s)
  - ISA-18.2 Alarm Deadband and State Machine Processor
  - Cryptographic / Role-Based Request Interceptors (RVAC)
  - MongoDB Persistent Storage Layer with 30-Day TTL History Indexing
                          |
                          v
[Layer 3: Industrial Supervisory HMI (React / Vite)]
  - Cubic Bezier Spline Waveform Telemetry Visualizer
  - Real-Time Storage Vessel Grid with Threshold Violation Badging
  - Multi-Persona Role Selection & Operational Clearances
  - Regulatory Compliance & Preventive Maintenance Work Order Engine
```

---

## Regulatory & Standards Compliance

The application logic and data schemas directly reflect the parameters defined in industrial safety standards:

1. **NFPA 2 (Hydrogen Technologies Code)**: Enforces separation distances, automatic isolation valve interlocks, emergency venting protocols, and flammability limit thresholds (Advisory at 1.0% LEL, Warning at 5.0% LEL, and Emergency Deluge at 25.0% LEL).
2. **ISO 19880-1:2020 (Gaseous Hydrogen Fueling Stations)**: Dictates Maximum Allowable Working Pressure (MAWP) envelopes, fueling protocol safety boundaries, and pressure relief valve operating margins.
3. **OSHA 1910.103 (Hydrogen Regulations)**: Mandates inspection schedules, mechanical relief valve certifications, and operating log retention.
4. **ASME Section VIII Division 3**: Governs design fatigue life cycle metrics for composite reinforced pressure vessels and Type IV storage buffers.
5. **ISA-18.2 / IEC 62682 (Management of Alarm Systems for the Process Industries)**: Enforces alarm deadband hysteresis to mitigate chattering around warning thresholds, structured acknowledgment states, and operator override audit trails.

---

## Role-Based Access Control (RVAC) Security Model

To prevent unauthorized manual overrides or inadvertent atmospheric venting of combustible gas, the system implements a strict Role-Based Access Control model featuring three predefined facility personnel personas:

### 1. Plant Safety Engineer (Level 4 Clearance)
- **Identity**: Dr. Aris Thorne (Badge: `SE-7001`)
- **Scope**: Entire Facility, High-Pressure Buffer Headers, and Cryogenic Enclosures
- **Permitted Operations**: Full supervisory control, emergency shutdown (ESD) trigger, Maximum Allowable Working Pressure (MAWP) threshold modification, alarm resolution, and maintenance scheduling.

### 2. Control Room Operator (Level 2 Clearance)
- **Identity**: Marcus Vance (Badge: `OP-4202`)
- **Scope**: Zone Alpha and Zone Beta Active Storage Pads
- **Permitted Operations**: Continuous sensor telemetry monitoring, audible and visual alarm acknowledgment, and emergency manual valve venting.
- **Restrictions**: Modification of safety envelopes and threshold limits is strictly prohibited (`403 Forbidden`).

### 3. Lead Compliance Auditor (Level 1 Clearance)
- **Identity**: Elena Rostova (Badge: `AUD-9103`)
- **Scope**: Regulatory Affairs, Inspection Verification, and Certification Division
- **Permitted Operations**: Inspection checklist audit, historical sensor data export, and NFPA/ISO audit sign-off.
- **Restrictions**: Actuator controls and relief valve actuation commands are strictly prohibited (`403 Forbidden`).

---

## Key Technical Features

### 1. ISA-18.2 Alarm Hysteresis and Deadbanding
To prevent alarm chattering when sensor readings fluctuate near critical limits, the ingestion engine evaluates state transitions using a calibrated hysteresis margin:
- **Pressure Deadband**: 5.0 bar for high-pressure gaseous vessels; 0.5 bar for low-pressure cryogenic vessels.
- **Hydrogen Concentration Deadband**: 0.5% LEL (200 ppm).
- **Temperature Deadband**: 1.5 degrees Celsius.
A warning or critical alert remains latched until the measured metric drops strictly below the limit minus the deadband threshold.

### 2. Trust Boundary Actuator Validation
Manual relief valve actuation (`POST /api/vessels/:id/relief-valve`) requires:
- Explicit operator confirmation flag (`confirmed: true`).
- Validated operator identifier (`operatorId`).
- Non-auditor role clearance (`x-operator-role` or session token).
Unconfirmed actuation calls are rejected with `400 Bad Request`. Every successful actuation automatically appends an entry to the incident ledger with timestamp, operator ID, and actuation justification.

### 3. Controlled Telemetry Retention
Continuous telemetry streams generate high-volume time-series data. The MongoDB storage tier utilizes an automated Time-To-Live index on the `timestamp` field (`expires: 2592000`), enforcing a 30-day rolling data retention window to preserve database efficiency and prevent disk exhaustion.

---

## Verification & Automated Test Suites

The codebase includes end-to-end and unit testing pipelines:

### Backend Safety Logic Verification
Executed via Node.js native test runner (`node:test`):
```bash
cd server
npm test
```
Tests verify:
- Correct registration and retention parameters of the Telemetry TTL index.
- Proper evaluation and latching of the ISA-18.2 deadband hysteresis algorithm.
- Trust boundary rejection of unconfirmed emergency venting requests.
- Enforcement of role clearance boundaries across all three personnel tiers.

### End-to-End Browser Testing with Playwright
Automated user interaction and role switching tests:
```bash
cd client
npm run test:e2e
```
Tests verify:
- Initial presentation of the RVAC personnel authorization enclave.
- Authentication and Level 4 actuation clearance verification for Dr. Aris Thorne.
- Clean persona switching, audit badge updates, and clearance restrictions for Marcus Vance.
- Read-only inspection enforcement for Elena Rostova.

---

## Installation & Deployment

### Option A: Containerized Execution via Docker Compose

Prerequisites: Docker Desktop or Docker Engine with Docker Compose v2.

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/umaiyavan-t/hydrogen-storage-safety-system.git
   cd hydrogen-storage-safety-system
   ```

2. Launch all containerized services:
   ```bash
   docker compose up -d --build
   ```

3. Access endpoints:
   - Supervisory HMI Dashboard: `http://localhost:3000`
   - RESTful API Health Check: `http://localhost:5000/health`
   - Facility Overview Endpoint: `http://localhost:5000/api/overview`

4. Terminate execution:
   ```bash
   docker compose down
   ```

### Option B: Local Development Execution

Prerequisites: Node.js (version 20 or higher) and MongoDB instance.

1. **Backend Server Configuration**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Populate MONGO_URI in .env with your local or Atlas connection string
   npm start
   ```

2. **Frontend Client Configuration**:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Access the client interface at `http://localhost:5173`.

### Option C: Cloud Deployment via Render

The repository contains a declarative Render Blueprint specification (`render.yaml`):
1. Connect the GitHub repository in the Render dashboard under **New > Blueprint**.
2. Provide the `MONGO_URI` environment variable pointing to a MongoDB Atlas cluster.
3. Render automatically provisions the Node.js API Web Service and the static Single-Page Application client with automatic path rewrites.

---

## Directory Organization

```text
hydrogen-storage-safety-system/
├── .agents/                 # AI pair programming guidelines and MCP integration manifests
├── .coderabbit.yaml         # CodeRabbit automated review configuration
├── .cursor/                 # Model Context Protocol configurations
├── .gitignore               # Version control exclusion rules
├── AGENTS.md                # Engineering constraints and codebase rules
├── docker-compose.yml       # Production multi-container orchestration with healthchecks
├── docs/                    # Technical architecture specifications and documentation
├── ponytail.md              # Senior developer execution principles
├── render.yaml              # Infrastructure-as-code deployment specification
├── report-generator/        # Academic report generation scripts and documentation builders
├── client/                  # React 18 frontend application
│   ├── e2e/                 # Playwright end-to-end test specifications
│   ├── src/                 # Component tree, pages, and WebSocket client services
│   └── package.json         # Client dependencies and build scripts
└── server/                  # Node.js Express backend
    ├── models/              # Mongoose data schemas (Vessel, Telemetry, Alert, etc.)
    ├── routes/              # RESTful routing endpoints and role guard interceptors
    ├── seed/                # Standardized baseline facility seed dataset
    ├── services/            # Telemetry ingestion, ISA-18.2 simulator, and socket broadcasting
    └── test_safety_logic.js # Safety boundary and role clearance test suite
```

---

## License

This project is released under the MIT License. See `LICENSE` for further details.
