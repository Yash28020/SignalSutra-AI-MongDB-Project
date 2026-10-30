import { useEffect, useState, useRef } from 'react'
import { api } from '../api/client'
import { capitalize } from '../utils/format'
import { Map as MapIcon } from 'lucide-react'

const SEVERITY_MARKER = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

const ASSET_MARKER = '#6366f1'

// Dynamically import Leaflet to avoid SSR issues
let L = null

export default function MapView() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [signals, setSignals] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sigRes, assetRes] = await Promise.all([
          api.listSignals({ limit: 200 }),
          api.listAssets({ limit: 200 }),
        ])
        setSignals(sigRes?.data || [])
        setAssets(assetRes?.data || [])
      } catch (e) {
        console.error('Map data load error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (loading || mapInstanceRef.current) return
    import('leaflet').then((leaflet) => {
      L = leaflet.default || leaflet

      // Fix default marker icons
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [20.5937, 78.9629], // India center
        zoom: 5,
        zoomControl: true,
      })

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(map)

      // Signal markers
      signals.forEach(s => {
        if (!s.location?.coordinates) return
        const [lng, lat] = s.location.coordinates
        const color = SEVERITY_MARKER[s.severity] || '#6366f1'
        const marker = L.circleMarker([lat, lng], {
          radius: s.severity === 'critical' ? 10 : s.severity === 'high' ? 8 : 6,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.5,
        }).addTo(map)

        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px">
            <strong>${capitalize(s.signalType)}</strong><br/>
            <span style="color:#94a3b8">Source:</span> ${s.source?.name || '—'}<br/>
            <span style="color:#94a3b8">Severity:</span> <span style="color:${color};font-weight:600">${s.severity?.toUpperCase()}</span><br/>
            <span style="color:#94a3b8">Value:</span> ${s.observation?.value} ${s.observation?.unit}<br/>
            <span style="color:#94a3b8">Status:</span> ${s.verificationStatus}
          </div>
        `)
      })

      // Asset markers (different shape - square markers)
      assets.forEach(a => {
        if (!a.location?.coordinates) return
        const [lng, lat] = a.location.coordinates
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="
              width:12px;height:12px;
              background:${ASSET_MARKER};
              border:2px solid #fff;
              border-radius:2px;
              box-shadow:0 0 8px rgba(99,102,241,0.5);
              transform:rotate(45deg);
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map)

        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;font-size:12px">
            <strong>${a.name}</strong><br/>
            <span style="color:#94a3b8">Type:</span> ${capitalize(a.assetType)}<br/>
            <span style="color:#94a3b8">Status:</span> <span style="color:${a.availabilityStatus === 'operational' ? '#10b981' : '#f59e0b'};font-weight:600">${a.availabilityStatus?.toUpperCase()}</span><br/>
            ${a.capacity ? `<span style="color:#94a3b8">Capacity:</span> ${a.capacity}` : ''}
          </div>
        `)
      })

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [loading, signals, assets])

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><span>Loading geo data…</span></div>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          Critical
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
          High
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          Moderate
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Low
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1', display: 'inline-block', transform: 'rotate(45deg)' }} />
          Asset
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
          {signals.length} signals · {assets.length} assets
        </span>
      </div>
      <div className="map-container" id="map-container">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
