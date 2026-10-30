"""Seed endpoint — populates the database with realistic demo data."""
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db

router = APIRouter()

# Indian cities with coordinates [lon, lat]
CITIES = [
    {"name": "Mumbai", "coords": [72.8777, 19.0760]},
    {"name": "Delhi", "coords": [77.1025, 28.7041]},
    {"name": "Bangalore", "coords": [77.5946, 12.9716]},
    {"name": "Chennai", "coords": [80.2707, 13.0827]},
    {"name": "Kolkata", "coords": [88.3639, 22.5726]},
    {"name": "Hyderabad", "coords": [78.4867, 17.3850]},
    {"name": "Pune", "coords": [73.8567, 18.5204]},
    {"name": "Ahmedabad", "coords": [72.5714, 23.0225]},
    {"name": "Jaipur", "coords": [75.7873, 26.9124]},
    {"name": "Lucknow", "coords": [80.9462, 26.8467]},
    {"name": "Bhopal", "coords": [77.4126, 23.2599]},
    {"name": "Kochi", "coords": [76.2673, 9.9312]},
    {"name": "Guwahati", "coords": [91.7362, 26.1445]},
    {"name": "Dehradun", "coords": [78.0322, 30.3165]},
    {"name": "Visakhapatnam", "coords": [83.2185, 17.6868]},
]

SIGNAL_TYPES = [
    "rainfall", "flood", "earthquake", "landslide", "fire",
    "wind", "temperature", "river_level", "infrastructure_damage",
    "power_outage", "road_block", "chemical", "other",
]
SEVERITIES = ["low", "moderate", "high", "critical"]
VERIFICATION_STATUSES = ["verified", "unverified", "pending"]
SOURCE_TYPES = ["sensor", "citizen", "satellite", "model", "manual"]
INCIDENT_TYPES = [
    "flood", "earthquake", "landslide", "fire", "cyclone",
    "industrial", "infrastructure", "multi_hazard",
]
INCIDENT_STATUSES = ["detected", "monitoring", "active", "contained", "resolved"]
ASSET_TYPES = [
    "hospital", "fire_station", "police_station", "shelter",
    "bridge", "dam", "power_plant", "water_treatment",
    "communication_tower", "warehouse", "helipad",
]
ASSET_STATUSES = ["operational", "operational", "operational", "partial", "offline"]
ACTION_TYPES = [
    "evacuate", "deploy_team", "distribute_supplies",
    "medical_response", "infrastructure_repair",
    "communication", "search_rescue",
]
ACTION_STATUSES = ["planned", "in_progress", "completed", "cancelled"]
ACTION_PRIORITIES = ["low", "medium", "high", "critical"]


def _jitter(coord: float, scale: float = 0.05) -> float:
    return coord + random.uniform(-scale, scale)


def _random_dt(days_back: int = 30) -> datetime:
    return datetime.now(timezone.utc) - timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


@router.post("")
async def seed_database(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Drop existing data and seed all collections with demo data."""
    # ── clear ──────────────────────────────────────────────────────────
    for col in ["signals", "incidents", "infrastructure_assets",
                "response_actions", "risk_assessments", "audit_events"]:
        await db[col].delete_many({})

    inserted = {}

    # ── signals (60) ───────────────────────────────────────────────────
    signals = []
    for i in range(60):
        city = random.choice(CITIES)
        sig_type = random.choice(SIGNAL_TYPES)
        sev = random.choices(SEVERITIES, weights=[30, 35, 25, 10])[0]
        observed = _random_dt(30)
        signals.append({
            "signalType": sig_type,
            "source": {
                "type": random.choice(SOURCE_TYPES),
                "name": f"{city['name']} Sensor #{random.randint(1,50)}",
                "sourceId": f"SRC-{i+1:04d}",
            },
            "location": {
                "type": "Point",
                "coordinates": [_jitter(city["coords"][0]), _jitter(city["coords"][1])],
            },
            "observedAt": observed,
            "verificationStatus": random.choice(VERIFICATION_STATUSES),
            "observation": {
                "value": round(random.uniform(0.1, 200), 2),
                "unit": random.choice(["mm", "m/s", "°C", "richter", "m", "ppm"]),
                "description": f"Automated reading near {city['name']}",
            },
            "severity": sev,
            "tags": random.sample(["monsoon", "urban", "rural", "coastal", "hilly", "industrial", "residential"], k=random.randint(1, 3)),
            "simulation": True,
            "createdAt": observed,
            "updatedAt": observed,
        })
    result = await db["signals"].insert_many(signals)
    inserted["signals"] = len(result.inserted_ids)
    signal_ids = [str(sid) for sid in result.inserted_ids]

    # ── incidents (12) ─────────────────────────────────────────────────
    incidents = []
    for i in range(12):
        city = random.choice(CITIES)
        created = _random_dt(20)
        incidents.append({
            "title": f"{random.choice(INCIDENT_TYPES).replace('_',' ').title()} Alert — {city['name']}",
            "description": f"Automated incident detected in the {city['name']} metropolitan area. Multiple signals correlated.",
            "incidentType": random.choice(INCIDENT_TYPES),
            "severity": random.choices(SEVERITIES, weights=[15, 30, 35, 20])[0],
            "status": random.choice(INCIDENT_STATUSES),
            "region": {
                "center": {
                    "type": "Point",
                    "coordinates": [city["coords"][0], city["coords"][1]],
                },
                "radiusKm": round(random.uniform(5, 80), 1),
                "name": city["name"],
            },
            "linkedSignalIds": random.sample(signal_ids, k=min(random.randint(2, 6), len(signal_ids))),
            "simulation": True,
            "createdAt": created,
            "updatedAt": created + timedelta(hours=random.randint(1, 48)),
        })
    result = await db["incidents"].insert_many(incidents)
    inserted["incidents"] = len(result.inserted_ids)
    incident_ids = [str(iid) for iid in result.inserted_ids]

    # ── infrastructure assets (25) ─────────────────────────────────────
    assets = []
    for i in range(25):
        city = random.choice(CITIES)
        asset_type = random.choice(ASSET_TYPES)
        created = _random_dt(90)
        assets.append({
            "name": f"{city['name']} {asset_type.replace('_',' ').title()} #{random.randint(1,10)}",
            "assetType": asset_type,
            "location": {
                "type": "Point",
                "coordinates": [_jitter(city["coords"][0], 0.03), _jitter(city["coords"][1], 0.03)],
            },
            "capacity": random.randint(50, 2000) if asset_type in ("hospital", "shelter", "warehouse") else None,
            "availabilityStatus": random.choice(ASSET_STATUSES),
            "contactInfo": f"+91-{random.randint(7000000000,9999999999)}",
            "tags": [asset_type, city["name"].lower()],
            "createdAt": created,
            "updatedAt": created,
        })
    result = await db["infrastructure_assets"].insert_many(assets)
    inserted["assets"] = len(result.inserted_ids)
    asset_ids = [str(aid) for aid in result.inserted_ids]

    # ── response actions (18) ──────────────────────────────────────────
    actions = []
    for i in range(18):
        created = _random_dt(15)
        actions.append({
            "incidentId": random.choice(incident_ids),
            "title": f"{random.choice(ACTION_TYPES).replace('_',' ').title()} Operation #{i+1}",
            "description": "Coordinated response operation initiated by command center.",
            "actionType": random.choice(ACTION_TYPES),
            "priority": random.choice(ACTION_PRIORITIES),
            "status": random.choice(ACTION_STATUSES),
            "assignedTo": random.choice(["Team Alpha", "Team Bravo", "Team Charlie", "NDRF Unit", "Local Fire Dept"]),
            "estimatedDurationMinutes": random.choice([30, 60, 120, 240, 480]),
            "linkedAssetIds": random.sample(asset_ids, k=min(random.randint(0, 3), len(asset_ids))),
            "createdAt": created,
            "updatedAt": created,
        })
    result = await db["response_actions"].insert_many(actions)
    inserted["actions"] = len(result.inserted_ids)

    # ── risk assessments (10) ──────────────────────────────────────────
    assessments = []
    for i in range(10):
        assessed = _random_dt(10)
        overall = round(random.uniform(1, 9.5), 2)
        assessments.append({
            "incidentId": random.choice(incident_ids),
            "riskLevel": "critical" if overall > 7 else "high" if overall > 5 else "moderate" if overall > 3 else "low",
            "overallScore": overall,
            "factors": [
                {"factor": "Population density", "weight": 0.3, "score": round(random.uniform(1, 10), 1), "description": "People at risk in affected area"},
                {"factor": "Infrastructure exposure", "weight": 0.25, "score": round(random.uniform(1, 10), 1), "description": "Critical infrastructure in zone"},
                {"factor": "Historical frequency", "weight": 0.2, "score": round(random.uniform(1, 10), 1), "description": "Past events in this region"},
                {"factor": "Response readiness", "weight": 0.25, "score": round(random.uniform(1, 10), 1), "description": "Available resources and teams"},
            ],
            "summary": f"Risk assessment for incident area. Overall risk score: {overall}/10.",
            "recommendations": random.sample([
                "Deploy additional NDRF teams",
                "Activate emergency shelters",
                "Issue public evacuation advisory",
                "Pre-position medical supplies",
                "Reinforce flood barriers",
                "Establish communication relay points",
                "Mobilize aerial reconnaissance",
            ], k=random.randint(2, 4)),
            "assessedBy": random.choice(["system", "analyst-1", "analyst-2"]),
            "assessedAt": assessed,
            "createdAt": assessed,
        })
    result = await db["risk_assessments"].insert_many(assessments)
    inserted["assessments"] = len(result.inserted_ids)

    # ── audit events (20) ──────────────────────────────────────────────
    audit_events = []
    for i in range(20):
        created = _random_dt(15)
        entity_type = random.choice(["signal", "incident", "action", "asset"])
        audit_events.append({
            "entityType": entity_type,
            "entityId": random.choice(signal_ids if entity_type == "signal" else incident_ids),
            "eventType": random.choice(["created", "updated", "verified", "escalated", "resolved"]),
            "actor": random.choice(["system", "admin", "analyst-1", "analyst-2"]),
            "details": f"Automated {entity_type} event #{i+1}",
            "createdAt": created,
        })
    result = await db["audit_events"].insert_many(audit_events)
    inserted["audit_events"] = len(result.inserted_ids)

    return {"message": "Database seeded successfully", "inserted": inserted}
