/**
 * SignalSutra AI — MongoDB Initialization & Indexing Script
 * 
 * Usage:
 *   mongosh signalsutra < database/init-mongo.js
 *   or inside mongo-init container
 */

const dbName = "signalsutra";
const db = db.getSiblingDB(dbName);

print(`[SignalSutra AI] Initializing database: ${dbName}...`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Collections & JSON Schema Validation
// ─────────────────────────────────────────────────────────────────────────────

// signals
if (!db.getCollectionNames().includes("signals")) {
  db.createCollection("signals", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["signalType", "source", "location", "observedAt", "severity", "observation"],
        properties: {
          signalType: {
            bsonType: "string",
            description: "Must be a recognized disaster telemetry type",
          },
          source: {
            bsonType: "object",
            required: ["type", "name"],
            properties: {
              type: { enum: ["sensor", "citizen", "satellite", "model", "manual"] },
              name: { bsonType: "string" },
              sourceId: { bsonType: ["string", "null"] },
            },
          },
          location: {
            bsonType: "object",
            required: ["type", "coordinates"],
            properties: {
              type: { enum: ["Point"] },
              coordinates: {
                bsonType: "array",
                minItems: 2,
                maxItems: 2,
                items: { bsonType: "double" },
              },
            },
          },
          observedAt: { bsonType: "date" },
          severity: { enum: ["low", "moderate", "high", "critical"] },
          verificationStatus: { enum: ["verified", "unverified", "pending", "rejected"] },
          observation: {
            bsonType: "object",
            required: ["value", "unit"],
            properties: {
              value: { bsonType: ["double", "int", "long"] },
              unit: { bsonType: "string" },
              description: { bsonType: ["string", "null"] },
            },
          },
        },
      },
    },
  });
  print("✓ Collection 'signals' created with schema validator.");
}

// incidents
if (!db.getCollectionNames().includes("incidents")) {
  db.createCollection("incidents", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["title", "incidentType", "severity", "status", "region"],
        properties: {
          title: { bsonType: "string" },
          incidentType: { bsonType: "string" },
          severity: { enum: ["low", "moderate", "high", "critical"] },
          status: { enum: ["detected", "monitoring", "active", "contained", "resolved"] },
          region: {
            bsonType: "object",
            required: ["center", "radiusKm", "name"],
            properties: {
              center: {
                bsonType: "object",
                required: ["type", "coordinates"],
                properties: {
                  type: { enum: ["Point"] },
                  coordinates: { bsonType: "array", minItems: 2, maxItems: 2 },
                },
              },
              radiusKm: { bsonType: ["double", "int"] },
              name: { bsonType: "string" },
            },
          },
        },
      },
    },
  });
  print("✓ Collection 'incidents' created with schema validator.");
}

// infrastructure_assets
if (!db.getCollectionNames().includes("infrastructure_assets")) {
  db.createCollection("infrastructure_assets");
  print("✓ Collection 'infrastructure_assets' created.");
}

// response_actions
if (!db.getCollectionNames().includes("response_actions")) {
  db.createCollection("response_actions");
  print("✓ Collection 'response_actions' created.");
}

// risk_assessments
if (!db.getCollectionNames().includes("risk_assessments")) {
  db.createCollection("risk_assessments");
  print("✓ Collection 'risk_assessments' created.");
}

// audit_events
if (!db.getCollectionNames().includes("audit_events")) {
  db.createCollection("audit_events");
  print("✓ Collection 'audit_events' created.");
}

// signal_links
if (!db.getCollectionNames().includes("signal_links")) {
  db.createCollection("signal_links");
  print("✓ Collection 'signal_links' created.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Indexes
// ─────────────────────────────────────────────────────────────────────────────

print("[SignalSutra AI] Configuring indexes...");

// signals indexes
db.signals.createIndex({ location: "2dsphere" }, { name: "idx_signals_location_2dsphere" });
db.signals.createIndex({ signalType: 1, severity: 1, observedAt: -1 }, { name: "idx_signals_type_sev_time" });
db.signals.createIndex({ observedAt: -1 }, { name: "idx_signals_observedAt_desc" });
db.signals.createIndex({ verificationStatus: 1 }, { name: "idx_signals_status" });

// incidents indexes
db.incidents.createIndex({ "region.center": "2dsphere" }, { name: "idx_incidents_center_2dsphere" });
db.incidents.createIndex({ status: 1, severity: 1 }, { name: "idx_incidents_status_sev" });
db.incidents.createIndex({ updatedAt: -1 }, { name: "idx_incidents_updatedAt_desc" });
db.incidents.createIndex({ title: "text", description: "text" }, { name: "idx_incidents_text_search" });

// infrastructure_assets indexes
db.infrastructure_assets.createIndex({ location: "2dsphere" }, { name: "idx_assets_location_2dsphere" });
db.infrastructure_assets.createIndex({ assetType: 1, availabilityStatus: 1 }, { name: "idx_assets_type_status" });

// response_actions indexes
db.response_actions.createIndex({ incidentId: 1, status: 1 }, { name: "idx_actions_incident_status" });
db.response_actions.createIndex({ priority: 1, createdAt: -1 }, { name: "idx_actions_priority_time" });

// risk_assessments indexes
db.risk_assessments.createIndex({ incidentId: 1, assessedAt: -1 }, { name: "idx_assessments_incident_time" });
db.risk_assessments.createIndex({ riskLevel: 1 }, { name: "idx_assessments_level" });

// audit_events indexes
db.audit_events.createIndex({ entityType: 1, entityId: 1 }, { name: "idx_audit_entity" });
db.audit_events.createIndex({ createdAt: -1 }, { name: "idx_audit_created_desc" });

// signal_links indexes
db.signal_links.createIndex({ incidentId: 1, signalId: 1 }, { unique: true, name: "idx_links_incident_signal_unique" });

print("✓ All indexes configured successfully.");
print("[SignalSutra AI] Database setup complete!");
