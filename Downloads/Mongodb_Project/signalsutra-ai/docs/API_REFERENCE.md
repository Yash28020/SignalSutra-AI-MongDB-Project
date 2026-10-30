# SignalSutra AI — REST API Reference

Base URL: `http://localhost:8000/api`

---

## 1. System & Health

### GET `/api/health`
Health check and database connectivity verification.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "0.1.0"
}
```

### POST `/api/seed`
Drops existing collections and re-seeds realistic demo data across all 6 collections.
- **Response `200 OK`**:
```json
{
  "message": "Database seeded successfully",
  "inserted": {
    "signals": 60,
    "incidents": 12,
    "assets": 25,
    "actions": 18,
    "assessments": 10,
    "audit_events": 20
  }
}
```

---

## 2. Dashboard

### GET `/api/dashboard`
Aggregated command center telemetry, KPI counters, and timeline series.
- **Response `200 OK`**:
```json
{
  "totalSignals": 60,
  "totalIncidents": 12,
  "activeIncidents": 8,
  "totalAssets": 25,
  "operationalAssets": 19,
  "pendingActions": 11,
  "criticalAlerts": 5,
  "avgRiskScore": 5.4,
  "signalsBySeverity": [
    {"severity": "moderate", "count": 24},
    {"severity": "low", "count": 19},
    {"severity": "high", "count": 12},
    {"severity": "critical", "count": 5}
  ],
  "signalsByType": [ ... ],
  "signalTimeline": [
    {"date": "2026-10-01", "count": 4},
    {"date": "2026-10-02", "count": 2}
  ],
  "recentSignals": [ ... ],
  "recentIncidents": [ ... ]
}
```

---

## 3. Signals API

### GET `/api/signals`
List signals with filtering and pagination.
- **Query Parameters**:
  - `signalType` (optional string): e.g. `rainfall`, `flood`, `earthquake`
  - `severity` (optional string): `low`, `moderate`, `high`, `critical`
  - `verificationStatus` (optional string): `verified`, `unverified`, `pending`, `rejected`
  - `skip` (default 0): Offset
  - `limit` (default 50, max 200): Page size
- **Response `200 OK`**:
```json
{
  "data": [ ... ],
  "total": 60,
  "skip": 0,
  "limit": 50
}
```

### GET `/api/signals/nearby`
Find signals within a geographic radius using `$nearSphere`.
- **Query Parameters**:
  - `longitude` (float, required): Longitude in degrees [-180, 180]
  - `latitude` (float, required): Latitude in degrees [-90, 90]
  - `radiusKm` (float, default 50): Search radius in kilometers
  - `limit` (int, default 20): Maximum results to return
- **Response `200 OK`**:
```json
{
  "data": [ ... ]
}
```

### POST `/api/signals`
Broadcast and register a new signal.
- **Request Body**:
```json
{
  "signalType": "flood",
  "source": {
    "type": "sensor",
    "name": "Mumbai Coastal Doppler",
    "sourceId": "SRC-1049"
  },
  "location": {
    "type": "Point",
    "coordinates": [72.8777, 19.0760]
  },
  "severity": "high",
  "observedAt": "2026-10-27T10:00:00Z",
  "observation": {
    "value": 115.4,
    "unit": "mm",
    "description": "High tide flash runoff"
  },
  "tags": ["monsoon", "coastal"],
  "verificationStatus": "pending"
}
```
- **Response `201 Created`**

### GET `/api/signals/{signal_id}`
Retrieve a signal by its unique identifier.

### PATCH `/api/signals/{signal_id}`
Update signal fields (e.g. `verificationStatus`, `severity`).

### DELETE `/api/signals/{signal_id}`
Remove a signal record (`204 No Content`).

---

## 4. Incidents API

### GET `/api/incidents`
List incidents with filtering (`incidentType`, `severity`, `status`, pagination).

### POST `/api/incidents`
Declare a new emergency incident.
- **Request Body**:
```json
{
  "title": "Severe Flash Flood Inundation — Thane Basin",
  "description": "Critical water level rise exceeding barrier threshold.",
  "incidentType": "flood",
  "severity": "critical",
  "status": "active",
  "region": {
    "center": {
      "type": "Point",
      "coordinates": [72.9781, 19.2183]
    },
    "radiusKm": 15.0,
    "name": "Thane Metro"
  },
  "linkedSignalIds": []
}
```
- **Response `201 Created`**

### PATCH `/api/incidents/{incident_id}`
Update incident properties or escalate/contain status (`detected`, `monitoring`, `active`, `contained`, `resolved`).

### DELETE `/api/incidents/{incident_id}`
Delete an incident (`204 No Content`).

---

## 5. Infrastructure Assets API

### GET `/api/assets`
List critical facilities (`assetType`, `status`, pagination).

### GET `/api/assets/nearby`
Find assets closest to coordinates (`longitude`, `latitude`, `radiusKm`).

### POST `/api/assets`
Register a hospital, helipad, shelter, or utility asset.

### PATCH `/api/assets/{asset_id}`
Update asset availability status (`operational`, `partial`, `offline`, `destroyed`).

### DELETE `/api/assets/{asset_id}`
Delete an asset (`204 No Content`).

---

## 6. Response Actions API

### GET `/api/actions`
List actions with filtering by `incidentId`, `status`, `priority`.

### POST `/api/actions`
Deploy and task a rescue team.

### PATCH `/api/actions/{action_id}`
Advance action workflow (`planned` -> `in_progress` -> `completed` / `cancelled`).

### DELETE `/api/actions/{action_id}`
Delete an action (`204 No Content`).

---

## 7. Risk Assessments API

### GET `/api/assessments`
List risk evaluations by `incidentId` or `riskLevel`.

### POST `/api/assessments`
Record a new risk assessment model evaluation.

### DELETE `/api/assessments/{assessment_id}`
Delete a risk assessment record (`204 No Content`).
