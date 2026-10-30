import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import UniverseNav from './components/universe/UniverseNav'
import UniverseHeader from './components/universe/UniverseHeader'
import CosmicBackground from './components/universe/CosmicBackground'

// Six Interconnected Worlds
import Nexus from './pages/Nexus'
import SignalGalaxy from './pages/SignalGalaxy'
import EarthObservatory from './pages/EarthObservatory'
import IntelligenceChamber from './pages/IntelligenceChamber'
import ResponseForge from './pages/ResponseForge'
import MemoryVault from './pages/MemoryVault'

export default function App() {
  const [is3DMode, setIs3DMode] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="multiverse-container">
      {/* ── Global Cosmic Nebula Canvas & Starfield ──────────────────── */}
      <CosmicBackground />

      {/* ── Persistent Universe Navigation Rail ──────────────────────── */}
      <UniverseNav />

      {/* ── Universe Stage ──────────────────────────────────────────── */}
      <div className="universe-stage">
        {/* Global Universe Header Bar */}
        <UniverseHeader
          is3DMode={is3DMode}
          setIs3DMode={setIs3DMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* World Viewport */}
        <main className="world-viewport">
          <Routes>
            {/* World 1: The Nexus (Command Center) */}
            <Route
              path="/"
              element={<Nexus is3DMode={is3DMode} searchQuery={searchQuery} />}
            />
            <Route path="/nexus" element={<Navigate to="/" replace />} />

            {/* World 2: Signal Galaxy (Observation Cosmos) */}
            <Route
              path="/signals"
              element={<SignalGalaxy is3DMode={is3DMode} searchQuery={searchQuery} />}
            />
            <Route path="/galaxy" element={<Navigate to="/signals" replace />} />

            {/* World 3: Earth Observatory (Living Geospatial) */}
            <Route
              path="/map"
              element={<EarthObservatory is3DMode={is3DMode} setIs3DMode={setIs3DMode} searchQuery={searchQuery} />}
            />
            <Route path="/earth" element={<Navigate to="/map" replace />} />

            {/* World 4: Intelligence Chamber (Evidence & Risk) */}
            <Route
              path="/intelligence"
              element={<IntelligenceChamber is3DMode={is3DMode} searchQuery={searchQuery} />}
            />
            <Route path="/incidents" element={<Navigate to="/intelligence" replace />} />

            {/* World 5: Response Forge (Operations & Simulator) */}
            <Route
              path="/actions"
              element={<ResponseForge is3DMode={is3DMode} searchQuery={searchQuery} />}
            />
            <Route path="/assets" element={<Navigate to="/actions" replace />} />
            <Route path="/forge" element={<Navigate to="/actions" replace />} />

            {/* World 6: Memory Vault (Archive & Replay) */}
            <Route
              path="/memory"
              element={<MemoryVault is3DMode={is3DMode} searchQuery={searchQuery} />}
            />
            <Route path="/vault" element={<Navigate to="/memory" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
