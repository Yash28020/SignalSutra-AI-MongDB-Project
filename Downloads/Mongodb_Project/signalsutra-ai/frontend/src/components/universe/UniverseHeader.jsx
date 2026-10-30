import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../../api/client'
import { WORLDS } from './UniverseNav'
import {
  Search,
  Database,
  RefreshCw,
  Sparkles,
  Layers,
  Box,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { celestialAudio } from './CelestialAudio'

export default function UniverseHeader({ is3DMode, setIs3DMode, searchQuery, setSearchQuery }) {
  const location = useLocation()
  const [dbConnected, setDbConnected] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)

  // Identify active world
  const currentWorld = WORLDS.find(w =>
    w.path === location.pathname || (w.path !== '/' && location.pathname.startsWith(w.path))
  ) || WORLDS[0]

  useEffect(() => {
    let mounted = true
    const checkDb = async () => {
      try {
        const res = await api.health()
        if (mounted) setDbConnected(res?.status === 'healthy')
      } catch {
        if (mounted) setDbConnected(false)
      }
    }
    checkDb()
    const timer = setInterval(checkDb, 15000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    celestialAudio.playPortalChime(1.4)
    try {
      await api.seed()
      setSeedSuccess(true)
      setTimeout(() => setSeedSuccess(false), 3000)
      window.dispatchEvent(new CustomEvent('signalsutra:refresh'))
    } catch (e) {
      alert(`Seed failed: ${e.message}`)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <header className="universe-topbar">
      <div className="topbar-left">
        <div className="world-title-wrapper">
          <span className="world-subtitle">{currentWorld.subtitle}</span>
          <h1 className="world-title">
            <currentWorld.icon size={20} color="var(--celestial-cyan)" />
            <span>{currentWorld.name}</span>
          </h1>
        </div>

        {/* Global Multiverse Search */}
        <div className="topbar-search">
          <Search size={14} className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search signals, incidents, assets..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* 2D / 3D Multiverse Dimension Mode Switcher */}
        <button
          className={`btn-celestial ${is3DMode ? 'btn-celestial-primary' : ''}`}
          onClick={() => {
            setIs3DMode(!is3DMode)
            celestialAudio.playPortalChime(is3DMode ? 0.9 : 1.2)
          }}
          title="Toggle between 3D Spatial Universe and 2D High-Performance Dashboard"
        >
          {is3DMode ? <Box size={14} /> : <Layers size={14} />}
          <span>{is3DMode ? '3D Universe' : '2D Matrix'}</span>
        </button>

        {/* MongoDB Cluster Health Status */}
        <div className="pulse-badge" title="MongoDB Cluster Synchronized">
          <div className={`pulse-dot`} style={{ background: dbConnected ? 'var(--magical-teal)' : 'var(--critical-coral)' }} />
          <Database size={13} color={dbConnected ? 'var(--magical-teal)' : 'var(--critical-coral)'} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {dbConnected ? 'MONGODB LIVE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Seed Demo Telemetry Button */}
        <button
          className="btn-celestial"
          onClick={handleSeed}
          disabled={seeding}
          title="Re-seed MongoDB with realistic disaster signals & incidents"
        >
          {seeding ? (
            <RefreshCw size={13} className="spin" />
          ) : seedSuccess ? (
            <CheckCircle2 size={13} color="var(--magical-teal)" />
          ) : (
            <Sparkles size={13} color="var(--starlight-gold)" />
          )}
          <span>{seeding ? 'Seeding…' : seedSuccess ? 'Seeded!' : 'Seed Cosmos'}</span>
        </button>
      </div>
    </header>
  )
}
