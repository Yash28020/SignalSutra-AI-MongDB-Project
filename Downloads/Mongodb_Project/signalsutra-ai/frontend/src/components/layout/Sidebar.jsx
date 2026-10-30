import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import {
  LayoutDashboard, Radio, AlertTriangle, Map,
  Building2, Zap, Activity,
} from 'lucide-react'

const NAV_ITEMS = [
  { section: 'Overview' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'Operations' },
  { to: '/signals', icon: Radio, label: 'Signals' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { to: '/map', icon: Map, label: 'Geo Intel' },
  { section: 'Resources' },
  { to: '/assets', icon: Building2, label: 'Assets' },
  { to: '/actions', icon: Zap, label: 'Actions' },
]

export default function Sidebar() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const check = () => api.health().then(setHealth).catch(() => setHealth({ status: 'offline' }))
    check()
    const iv = setInterval(check, 15000)
    return () => clearInterval(iv)
  }, [])

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Activity />
        </div>
        <div>
          <div className="sidebar-title">SignalSutra</div>
          <div className="sidebar-subtitle">AI Command Center</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-label">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* Footer – DB status */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <div className={`dot ${health?.status === 'healthy' ? '' : 'offline'}`} />
          <span>
            {health?.status === 'healthy'
              ? 'MongoDB Connected'
              : health?.status === 'degraded'
              ? 'DB Degraded'
              : 'Connecting…'}
          </span>
        </div>
      </div>
    </aside>
  )
}
