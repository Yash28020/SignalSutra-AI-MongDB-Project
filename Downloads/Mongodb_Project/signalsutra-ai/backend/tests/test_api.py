"""Comprehensive test suite for SignalSutra AI backend API endpoints."""
import pytest
from starlette.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def client():
    """Test client with application lifespan management."""
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    """Health check endpoint should report healthy status."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_dashboard_stats(client):
    """Dashboard endpoint should return aggregate statistics."""
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "totalSignals" in data
    assert "totalIncidents" in data
    assert "activeIncidents" in data
    assert "totalAssets" in data
    assert "operationalAssets" in data
    assert "pendingActions" in data
    assert "signalsBySeverity" in data
    assert "signalsByType" in data
    assert "recentSignals" in data
    assert "recentIncidents" in data


def test_list_signals_pagination_and_filters(client):
    """List signals with pagination and filtering."""
    # Base listing with limit
    res = client.get("/api/signals?limit=5")
    assert res.status_code == 200
    body = res.json()
    assert "data" in body
    assert "total" in body
    assert len(body["data"]) <= 5

    # Filter by severity
    res_sev = client.get("/api/signals?severity=critical")
    assert res_sev.status_code == 200
    for s in res_sev.json()["data"]:
        assert s["severity"] == "critical"


def test_signals_crud_lifecycle(client):
    """Create, retrieve, update, and delete a signal."""
    payload = {
        "signalType": "flood",
        "source": {
            "type": "sensor",
            "name": "Integration Test Sensor",
            "sourceId": "IT-TEST-001"
        },
        "location": {
            "type": "Point",
            "coordinates": [72.8777, 19.0760]
        },
        "severity": "high",
        "observedAt": "2026-10-27T10:00:00Z",
        "observation": {
            "value": 145.5,
            "unit": "mm",
            "description": "Flash flood warning sensor reading"
        },
        "tags": ["integration-test", "monsoon"],
        "verificationStatus": "pending"
    }
    # Create
    create_res = client.post("/api/signals", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    sig_id = created["id"]
    assert created["signalType"] == "flood"
    assert created["severity"] == "high"

    # Get by ID
    get_res = client.get(f"/api/signals/{sig_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == sig_id

    # Update verification status
    update_res = client.patch(f"/api/signals/{sig_id}", json={"verificationStatus": "verified"})
    assert update_res.status_code == 200
    assert update_res.json()["verificationStatus"] == "verified"

    # Clean up
    del_res = client.delete(f"/api/signals/{sig_id}")
    assert del_res.status_code == 204

    # Verify 404 after deletion
    get_after_del = client.get(f"/api/signals/{sig_id}")
    assert get_after_del.status_code == 404


def test_nearby_signals_geospatial(client):
    """Nearby signals geospatial query."""
    res = client.get("/api/signals/nearby?longitude=72.8777&latitude=19.0760&radiusKm=200")
    assert res.status_code == 200
    body = res.json()
    assert "data" in body
    assert isinstance(body["data"], list)


def test_incidents_crud_lifecycle(client):
    """Create, read, update, and clean up an incident."""
    payload = {
        "title": "Test Industrial Fire Outbreak",
        "description": "Hazardous materials response triggered in chemical corridor.",
        "incidentType": "fire",
        "severity": "critical",
        "status": "detected",
        "region": {
            "center": {
                "type": "Point",
                "coordinates": [72.8777, 19.0760]
            },
            "radiusKm": 12.5,
            "name": "Mumbai Port"
        },
        "linkedSignalIds": []
    }
    create_res = client.post("/api/incidents", json=payload)
    assert create_res.status_code == 201
    inc = create_res.json()
    inc_id = inc["id"]
    assert inc["title"] == payload["title"]

    # Read
    detail_res = client.get(f"/api/incidents/{inc_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["severity"] == "critical"

    # Update status
    patch_res = client.patch(f"/api/incidents/{inc_id}", json={"status": "contained"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "contained"

    # Clean up
    del_res = client.delete(f"/api/incidents/{inc_id}")
    assert del_res.status_code == 204


def test_assets_crud_and_nearby(client):
    """Create, list, nearby query, and delete an infrastructure asset."""
    payload = {
        "name": "Emergency Relief Helipad Alpha",
        "assetType": "helipad",
        "location": {
            "type": "Point",
            "coordinates": [77.5946, 12.9716]
        },
        "capacity": 2,
        "availabilityStatus": "operational",
        "contactInfo": "+91-9988776655",
        "tags": ["helipad", "airlift", "bangalore"]
    }
    create_res = client.post("/api/assets", json=payload)
    assert create_res.status_code == 201
    asset = create_res.json()
    asset_id = asset["id"]

    # Nearby assets
    nearby_res = client.get("/api/assets/nearby?longitude=77.5946&latitude=12.9716&radiusKm=50")
    assert nearby_res.status_code == 200
    assert any(a["id"] == asset_id for a in nearby_res.json()["data"])

    # Clean up
    del_res = client.delete(f"/api/assets/{asset_id}")
    assert del_res.status_code == 204


def test_actions_crud_lifecycle(client):
    """Create, list, and update a response action."""
    # First get an incident ID
    inc_res = client.get("/api/incidents?limit=1")
    incident_id = inc_res.json()["data"][0]["id"] if inc_res.json()["data"] else "dummy_inc_123"

    payload = {
        "incidentId": incident_id,
        "title": "Air Evacuation Sortie #1",
        "description": "Transport critically injured citizens to base hospital.",
        "actionType": "evacuate",
        "priority": "critical",
        "status": "planned",
        "assignedTo": "Aviation Wing Unit 4",
        "estimatedDurationMinutes": 90,
        "linkedAssetIds": []
    }
    create_res = client.post("/api/actions", json=payload)
    assert create_res.status_code == 201
    action = create_res.json()
    action_id = action["id"]

    # Update status
    patch_res = client.patch(f"/api/actions/{action_id}", json={"status": "in_progress"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "in_progress"

    # Clean up
    del_res = client.delete(f"/api/actions/{action_id}")
    assert del_res.status_code == 204


def test_assessments_crud_lifecycle(client):
    """Create, list, and delete a risk assessment."""
    inc_res = client.get("/api/incidents?limit=1")
    incident_id = inc_res.json()["data"][0]["id"] if inc_res.json()["data"] else "dummy_inc_123"

    payload = {
        "incidentId": incident_id,
        "riskLevel": "high",
        "overallScore": 7.8,
        "factors": [
            {"factor": "Structural integrity", "weight": 0.4, "score": 8.0, "description": "High damage observed"},
            {"factor": "Evacuation corridor", "weight": 0.6, "score": 7.6, "description": "Partially blocked"}
        ],
        "summary": "Rapid risk assessment following earthquake aftershocks.",
        "recommendations": ["Establish perimeter", "Inspect foundation"],
        "assessedBy": "system-evaluator"
    }
    create_res = client.post("/api/assessments", json=payload)
    assert create_res.status_code == 201
    ass = create_res.json()
    ass_id = ass["id"]
    assert ass["riskLevel"] == "high"

    # Get by ID
    get_res = client.get(f"/api/assessments/{ass_id}")
    assert get_res.status_code == 200
    assert get_res.json()["overallScore"] == 7.8

    # Clean up
    del_res = client.delete(f"/api/assessments/{ass_id}")
    assert del_res.status_code == 204
