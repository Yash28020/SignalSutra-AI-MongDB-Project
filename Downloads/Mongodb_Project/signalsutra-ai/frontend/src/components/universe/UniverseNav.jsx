import { NavLink, useLocation } from 'react-router-dom'
import {
  Compass,
  Radio,
  Globe2,
  GitFork,
  Zap,
  Library,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react'
import { celestialAudio } from './CelestialAudio'
import { useState } from 'react'

export const WORLDS = [
  {
    id: 'nexus',
    name: 'The Nexus',
    path: '/',
    subtitle: 'Command Center',
    icon: Compass,
    accent: 'cyan',
    glow: 'var(--cyan-glow)',
  },
  {
    id: 'galaxy',
    name: 'Signal Galaxy',
    path: '/signals',
    subtitle: 'Observation Cosmos',
    icon: Radio,
    accent: 'cyan',
    glow: 'var(--cyan-glow)',
  },
  {
    id: 'earth',
    name: 'Earth Observatory',
    path: '/map',
    subtitle: 'Living Geospatial',
    icon: Globe2,
    accent: 'teal',
    glow: 'var(--teal-glow)',
  },
  {
    id: 'chamber',
    name: 'Intelligence Chamber',
    path: '/intelligence',
    subtitle: 'Evidence & Relationships',
    icon: GitFork,
    accent: 'violet',
    glow: 'var(--violet-glow)',
  },
  {
    id: 'forge',
    name: 'Response Forge',
    path: '/actions',
    subtitle: 'Operations & Planner',
    icon: Zap,
    accent: 'coral',
    glow: 'var(--coral-glow)',
  },
  {
    id: 'vault',
    name: 'Memory Vault',
    path: '/memory',
    subtitle: 'Archive & Replay',
    icon: Library,
    accent: 'gold',
    glow: 'var(--gold-glow)',
  },
]

export default function UniverseNav() {
  const location = useLocation()
  const [isAudioActive, setIsAudioActive] = useState(false)

  const handlePortalClick = (worldId, index) => {
    celestialAudio.playPortalChime(1.0 + index * 0.1)
  }

  const toggleSound = () => {
    const active = celestialAudio.toggleMute()
    setIsAudioActive(active)
  }

  return (
    <nav className="universe-nav-rail" aria-label="Living Multiverse Navigation">
      {/* Brand Celestial Core */}
      <NavLink to="/" onClick={() => celestialAudio.playPortalChime(1.0)}>
        <div className="nav-brand-orb" title="SignalSutra AI — The Living Multiverse">
          <Sparkles size={20} color="#070B19" />
        </div>
      </NavLink>

      {/* Six Dimensional World Gateways */}
      <div className="nav-portals-list">
        {WORLDS.map((world, idx) => {
          const Icon = world.icon
          const isActive = location.pathname === world.path ||
            (world.path !== '/' && location.pathname.startsWith(world.path))

          return (
            <NavLink
              key={world.id}
              to={world.path}
              className={`nav-portal-btn ${isActive ? 'active' : ''}`}
              onClick={() => handlePortalClick(world.id, idx)}
            >
              {isActive && <div className="nav-portal-indicator" />}
              <Icon size={20} />
              <div className="portal-tooltip">
                <div style={{ color: 'var(--text-heading)', fontWeight: 700 }}>{world.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--celestial-cyan)' }}>{world.subtitle}</div>
              </div>
            </NavLink>
          )
        })}
      </div>

      {/* Audio & Ambient Controls */}
      <div className="nav-bottom-actions">
        <button
          className="nav-portal-btn"
          style={{ width: 40, height: 40 }}
          onClick={toggleSound}
          title={isAudioActive ? 'Mute Celestial Soundscape' : 'Enable Celestial Ambient Audio'}
        >
          {isAudioActive ? <Volume2 size={18} color="var(--celestial-cyan)" /> : <VolumeX size={18} />}
          <div className="portal-tooltip">
            {isAudioActive ? 'Soundscape Active' : 'Soundscape Muted'}
          </div>
        </button>
      </div>
    </nav>
  )
}
