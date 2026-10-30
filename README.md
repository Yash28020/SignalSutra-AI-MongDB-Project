# 📡 SignalSutra AI

> **Real-Time Disaster Signal Monitoring & Emergency Command Center**  
> Powered by **MongoDB**, **FastAPI (Async Motor)**, and **React + Vite**.

---

## 🌟 Overview

**SignalSutra AI** is an emergency intelligence platform designed for municipal disaster response authorities, civil defense units, and emergency operations centers. It ingests environmental sensor feeds, detects anomalous signals (floods, earthquakes, fires, landslides, heavy rainfall), correlates them into disaster incidents, computes multi-factor risk scores, and coordinates field response assets.

---

## ✨ Features

- **⚡ Command Center Dashboard**: Real-time KPI counters (active incidents, critical alerts, operational assets, avg risk score), 30-day signal frequency area chart, severity distribution, and live activity stream.
- **🛰️ Signal Monitor**: Ingest and track sensor feeds, satellite telemetry, and citizen reports. Filter by severity, type, and verification status. Mark signals as `verified` or `rejected` with one click.
- **🚨 Incident Tracker**: Correlate multi-hazard disaster events with geographic impact zones, radius circles, and linked sensor feeds. Transition incidents through lifecycle states (`detected` ➔ `monitoring` ➔ `active` ➔ `contained` ➔ `resolved`).
- **🗺️ Geo Intelligence Map**: Interactive Leaflet dark-themed map plotting color-coded signal severity circles and diamond-shaped infrastructure assets with clickable detail dossiers.
- **🏥 Infrastructure Assets**: Track readiness and capacity of hospitals, shelters, fire stations, dams, helipads, and emergency communication relays.
- **⚡ Response Actions**: Dispatch tactical teams (NDRF, Fire, Medical, Search & Rescue) with live progress controllers (`planned` ➔ `in_progress` ➔ `completed`).
- **🛡️ Geospatial & Aggregation Engine**: Native MongoDB `2dsphere` indexes and geospatial queries (`$nearSphere`), compound indexes, and aggregation pipelines.

---

## 🏗️ Architecture

```
signalsutra-ai/
├── backend/
│   ├── app/
│   │   ├── routes/           # REST API routes (signals, incidents, assets, actions, assessments, dashboard, seed)
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   ├── services/         # Async business logic & MongoDB aggregation pipelines
│   │   ├── config.py         # App configuration & environment loader
│   │   └── database.py       # Motor async client & index initialization
│   ├── tests/
│   │   └── test_api.py       # Comprehensive pytest test suite (100% passing)
│   ├── main.py               # FastAPI application entry point with lifespan
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # Glassmorphism UI components (Header, Sidebar, Modals)
│   │   ├── pages/            # Dashboard, Signals, Incidents, MapView, Assets, Actions
│   │   ├── api/client.js     # API client for backend communication
│   │   ├── index.css         # Custom dark glassmorphic design system
│   │   └── App.jsx           # Main application routing
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── init-mongo.js         # Mongo shell collection creation, schema validation & 2dsphere indexes
│   └── docker-compose.yml    # MongoDB 7.0 + Mongo Express container stack
└── docs/
    ├── ARCHITECTURE.md       # Full engineering specification
    └── API_REFERENCE.md      # REST API endpoints & request/response payloads
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- **MongoDB 7.0+** running locally on port `27017` (or via Docker)

### 1. Start MongoDB (Optional via Docker)
If you don't have MongoDB installed locally:
```bash
cd database
docker compose up -d
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000`.  
Swagger interactive docs: `http://localhost:8000/docs`.

### 3. Seed Realistic Demo Data
You can seed the database via the UI (using the **Seed Data** button in the header) or via curl:
```bash
curl -X POST http://localhost:8000/api/seed
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

To execute the test suite against the live API:
```bash
cd backend
pytest tests/test_api.py -v
```

All 9 end-to-end integration tests verify:
- Health checks & database ping
- Command center aggregation statistics
- Signal ingestion, pagination, and `$nearSphere` geo queries
- Incident lifecycle & status escalation
- Asset proximity search
- Response action dispatching
- Risk assessment calculation

---

## 📜 License
SignalSutra AI is open-source under the MIT License.
