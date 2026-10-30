import { useEffect, useState, useRef } from 'react'
import { api } from '../api/client'
import { capitalize, formatDate } from '../utils/format'
import GlobeScene from '../components/3d/GlobeScene'
import { celestialAudio } from '../components/universe/CelestialAudio'
import {
  Globe2,
  MapPin,
  Layers,
  Search,
  Sliders,
  Radio,
  Building2,
  AlertTriangle,
  Compass,
  Maximize2,
  X,
  Navigation,
} from 'lucide-react'

const SEVERITY_COLORS = {
  low: '#4FFFC0',
  moderate: '#FFD580',
  high: '#FB923C',
  critical: '#FF647C',
}

let L = null

export default function EarthObservatory({ is3DMode, setIs3DMode, searchQuery }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const [signals, setSignals] = useState([])
  const [incidents, setIncidents] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  // Floating Toolbar States
  const [layers, setLayers] = useState({ signals: true, incidents: true, assets: true })
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [nearbyResults, setNearbyResults] = useState(null)
  const [radiusKm, setRadiusKm] = useState(50)
  const [geoQueryCoords, setGeoQueryCoords] = useState({ lat: 19.0760, lon: 72.8777 }) // Mumbai default
  const [geoLoading, setGeoLoading] = useState(false)

  // Load all geospatial layers on mount
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        const [sigRes, incRes, assetRes] = await Promise.all([
          api.listSignals({ limit: 100 }),
          api.listIncidents({ limit: 50 }),
          api.listAssets({ limit: 50 }),
        ])
        if (mounted) {
          setSignals(sigRes?.data || [])
          setIncidents(incRes?.data || [])
          setAssets(assetRes?.data || [])
        }
      } catch (err) {
        console.error('Observatory data load error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [])

  // Execute Real MongoDB $nearSphere Geospatial Query
  const executeGeoRadiusQuery = async (lat, lon, radius) => {
    setGeoLoading(true)
    celestialAudio.playPortalChime(1.1)
    try {
      const [nearbySig, nearbyAss] = await Promise.all([
        api.nearbySignals(lon, lat, radius, 15),
        api.nearbyAssets(lon, lat, radius, 15),
      ])
      setNearbyResults({
        lat,
        lon,
        radius,
        signals: nearbySig?.data || [],
        assets: nearbyAss?.data || [],
      })
    } catch (e) {
      alert(`Geospatial query error: ${e.message}`)
    } finally {
      setGeoLoading(false)
    }
  }

  // Initialize Leaflet 2D Dark CARTO Map when not in 3D mode
  useEffect(() => {
    if (is3DMode || loading) return

    import('leaflet').then((leaflet) => {
      L = leaflet.default || leaflet

      // If map already initialized, clear and recreate
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [20.5937, 78.9629], // India Center
        zoom: 5,
        zoomControl: true,
      })

      // Dark CARTO tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      // Map Click -> Trigger MongoDB $nearSphere radius search!
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setGeoQueryCoords({ lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lng.toFixed(4)) })
        executeGeoRadiusQuery(lat, lng, radiusKm)
      })

      // Render Incident Zone Markers & Circles
      if (layers.incidents) {
        incidents.forEach((inc) => {
          const coords = inc.region?.center?.coordinates
          if (!coords) return
          const [lon, lat] = coords
          const color = SEVERITY_COLORS[inc.severity] || '#FF647C'

          // Impact radius circle
          L.circle([lat, lon], {
            radius: (inc.region?.radiusKm || 15) * 1000,
            color: color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 1,
            dashArray: '4, 8',
          }).addTo(map)

          // Center marker
          const marker = L.circleMarker([lat, lon], {
            radius: 9,
            fillColor: color,
            color: '#FFFFFF',
            weight: 2,
            fillOpacity: 0.9,
          }).addTo(map)

          marker.bindPopup(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#F8FAFC;">
              <strong style="color:${color};font-size:13px">${inc.title}</strong><br/>
              <span style="color:#94A3B8">Type:</span> ${capitalize(inc.incidentType)}<br/>
              <span style="color:#94A3B8">Status:</span> ${capitalize(inc.status)}<br/>
              <span style="color:#94A3B8">Zone:</span> ${inc.region?.name} (${inc.region?.radiusKm} km)
            </div>
          `)
        })
      }

      // Render Signal Telemetry Markers
      if (layers.signals) {
        signals.forEach((s) => {
          const coords = s.location?.coordinates
          if (!coords) return
          const [lon, lat] = coords
          const color = SEVERITY_COLORS[s.severity] || '#54E7FF'

          const sigMarker = L.circleMarker([lat, lon], {
            radius: s.severity === 'critical' ? 7 : 5,
            fillColor: color,
            color: color,
            weight: 1,
            fillOpacity: 0.6,
          }).addTo(map)

          sigMarker.bindPopup(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#F8FAFC;">
              <strong>${capitalize(s.signalType)}</strong><br/>
              <span style="color:#94A3B8">Reading:</span> ${s.observation?.value} ${s.observation?.unit}<br/>
              <span style="color:#94A3B8">Source:</span> ${s.source?.name}
            </div>
          `)
        })
      }

      // Render Infrastructure Asset Diamond Markers
      if (layers.assets) {
        assets.forEach((a) => {
          const coords = a.location?.coordinates
          if (!coords) return
          const [lon, lat] = coords

          const assetMarker = L.marker([lat, lon], {
            icon: L.divIcon({
              className: '',
              html: `<div style="
                width:10px;height:10px;
                background:#54E7FF;
                border:2px solid #FFFFFF;
                transform:rotate(45deg);
                box-shadow:0 0 8px rgba(84,231,255,0.7);
              "></div>`,
              iconSize: [10, 10],
              iconAnchor: [5, 5],
            }),
          }).addTo(map)

          assetMarker.bindPopup(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#F8FAFC;">
              <strong>${a.name}</strong><br/>
              <span style="color:#94A3B8">Classification:</span> ${capitalize(a.assetType)}<br/>
              <span style="color:#94A3B8">Readiness:</span> ${capitalize(a.availabilityStatus)}
            </div>
          `)
        })
      }

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [is3DMode, loading, layers, incidents, signals, assets, radiusKm])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── 3D Earth Globe Mode ─────────────────────────────────────────── */}
      {is3DMode && (
        <GlobeScene
          incidents={incidents}
          onSelectIncident={(inc) => {
            celestialAudio.playNodeBeep(inc.severity)
            setSelectedIncident(inc)
          }}
        />
      )}

      {/* ── 2D Leaflet Dark Map Container ───────────────────────────────── */}
      {!is3DMode && (
        <div style={{ width: '100%', height: '100%' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#070B19' }} />
        </div>
      )}

      {/* ── Floating Map Toolbar ────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 24,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(12, 19, 40, 0.8)',
          backdropFilter: 'blur(20px)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--celestial-cyan)', letterSpacing: '0.06em' }}>
          LAYERS:
        </span>

        {/* Toggle Incidents Layer */}
        <button
          className={`btn-celestial ${layers.incidents ? 'btn-celestial-primary' : ''}`}
          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          onClick={() => setLayers(l => ({ ...l, incidents: !l.incidents }))}
        >
          <AlertTriangle size={12} /> Incidents ({incidents.length})
        </button>

        {/* Toggle Signals Layer */}
        <button
          className={`btn-celestial ${layers.signals ? 'btn-celestial-primary' : ''}`}
          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          onClick={() => setLayers(l => ({ ...l, signals: !l.signals }))}
        >
          <Radio size={12} /> Signals ({signals.length})
        </button>

        {/* Toggle Assets Layer */}
        <button
          className={`btn-celestial ${layers.assets ? 'btn-celestial-primary' : ''}`}
          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          onClick={() => setLayers(l => ({ ...l, assets: !l.assets }))}
        >
          <Building2 size={12} /> Assets ({assets.length})
        </button>
      </div>

      {/* ── MongoDB $nearSphere Radius Geospatial Query HUD ─────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          zIndex: 30,
          background: 'var(--bg-glass-card)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          width: 320,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)' }}>
            <Navigation size={14} color="var(--celestial-cyan)" />
            <span>MongoDB $nearSphere Scanner</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{radiusKm} km radius</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input
            type="range"
            min="10"
            max="300"
            step="10"
            value={radiusKm}
            onChange={e => setRadiusKm(parseInt(e.target.value, 10))}
            style={{ flex: 1, accentColor: 'var(--celestial-cyan)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-celestial btn-celestial-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={geoLoading}
            onClick={() => executeGeoRadiusQuery(geoQueryCoords.lat, geoQueryCoords.lon, radiusKm)}
          >
            {geoLoading ? 'Executing Geo-Query…' : 'Scan Proximity'}
          </button>
        </div>
      </div>

      {/* ── Nearby Results Floating Dossier ─────────────────────────────── */}
      {nearbyResults && (
        <div
          style={{
            position: 'absolute',
            top: 76,
            right: 24,
            width: 360,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 40,
            background: 'var(--bg-glass-elevated)',
            backdropFilter: 'blur(28px)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Proximity Results ({nearbyResults.radius} km)
            </div>
            <button className="btn-celestial" style={{ padding: 4 }} onClick={() => setNearbyResults(null)}>
              <X size={14} />
            </button>
          </div>

          <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--celestial-cyan)', fontWeight: 700 }}>
              SIGNALS IN PROXIMITY ({nearbyResults.signals.length})
            </div>
            {nearbyResults.signals.map(s => (
              <div key={s.id} style={{ padding: 8, background: 'rgba(12, 19, 40, 0.5)', borderRadius: 6, fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{capitalize(s.signalType)}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {s.source?.name} · {s.observation?.value} {s.observation?.unit}
                </div>
              </div>
            ))}

            <div style={{ fontSize: '0.72rem', color: 'var(--magical-teal)', fontWeight: 700, marginTop: 8 }}>
              INFRASTRUCTURE IN PROXIMITY ({nearbyResults.assets.length})
            </div>
            {nearbyResults.assets.map(a => (
              <div key={a.id} style={{ padding: 8, background: 'rgba(12, 19, 40, 0.5)', borderRadius: 6, fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {capitalize(a.assetType)} · {capitalize(a.availabilityStatus)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
