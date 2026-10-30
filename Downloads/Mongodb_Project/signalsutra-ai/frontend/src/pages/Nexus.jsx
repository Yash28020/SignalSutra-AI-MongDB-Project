import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { timeAgo, capitalize } from '../utils/format'
import NexusScene from '../components/3d/NexusScene'
import { WORLDS } from '../components/universe/UniverseNav'
import { celestialAudio } from '../components/universe/CelestialAudio'
import {
  Radio,
  AlertTriangle,
  Building2,
  Zap,
  TrendingUp,
  Activity,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Compass,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

export default function Nexus({ is3DMode }) {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => api.dashboard(), [])
  const [activeTab, setActiveTab] = useState('feed')

  useEffect(() => {
    const handleRefresh = () => refetch()
    window.addEventListener('signalsutra:refresh', handleRefresh)
    return () => window.removeEventListener('signalsutra:refresh', handleRefresh)
  }, [refetch])

  if (loading) {
    return (
      <div className="cosmic-loading-orb">
        <div className="nebula-spinner" />
        <span style={{ fontSize: '0.85rem', color: 'var(--celestial-cyan)', letterSpacing: '0.1em' }}>
          INITIALIZING NEXUS INTELLIGENCE MULTIVERSE…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cosmic-empty-state">
        <AlertTriangle size={48} className="cosmic-empty-icon" />
        <h3 style={{ color: 'var(--text-heading)' }}>Celestial Link Disrupted</h3>
        <p style={{ maxWidth: 420 }}>{error}</p>
        <button className="btn-celestial btn-celestial-primary" onClick={() => refetch()}>
          Re-align Dimensional Gateway
        </button>
      </div>
    )
  }

  const d = data || {}

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── 3D Scene Layer (When 3D Mode is Active) ───────────────────── */}
      {is3DMode && (
        <NexusScene
          onSelectWorld={(portal) => {
            celestialAudio.playPortalChime(1.2)
            navigate(portal.path)
          }}
        />
      )}

      {/* ── Dimensional Portals Quick-Switch Dock (Bottom of 3D Canvas) ── */}
      {is3DMode && (
        <div className="portals-hud-dock">
          {WORLDS.map((w) => {
            const Icon = w.icon
            return (
              <button
                key={w.id}
                className="portal-dock-item"
                onClick={() => {
                  celestialAudio.playPortalChime(1.1)
                  navigate(w.path)
                }}
              >
                <Icon size={14} color="var(--celestial-cyan)" />
                <span>{w.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── UI Layer: Multiverse Command HUD Panels ───────────────────── */}
      <div
        className="world-content-scrollable"
        style={{
          position: 'relative',
          zIndex: 10,
          pointerEvents: is3DMode ? 'none' : 'auto',
          maxWidth: is3DMode ? '520px' : '100%',
          marginLeft: is3DMode ? 'auto' : 0,
          background: is3DMode ? 'transparent' : 'transparent',
        }}
      >
        {/* Floating KPI Matrix */}
        <div className="kpi-hologram-grid" style={{ pointerEvents: 'auto' }}>
          <div className="kpi-hologram-card">
            <div className="kpi-hologram-header">
              <span className="kpi-hologram-label">Total Telemetry</span>
              <div className="kpi-hologram-icon cyan"><Radio size={16} /></div>
            </div>
            <div className="kpi-hologram-value">{d.totalSignals || 0}</div>
          </div>

          <div className="kpi-hologram-card">
            <div className="kpi-hologram-header">
              <span className="kpi-hologram-label">Active Incidents</span>
              <div className="kpi-hologram-icon coral"><AlertTriangle size={16} /></div>
            </div>
            <div className="kpi-hologram-value">{d.activeIncidents || 0}</div>
          </div>

          <div className="kpi-hologram-card">
            <div className="kpi-hologram-header">
              <span className="kpi-hologram-label">Critical Alerts</span>
              <div className="kpi-hologram-icon coral"><ShieldAlert size={16} /></div>
            </div>
            <div className="kpi-hologram-value">{d.criticalAlerts || 0}</div>
          </div>

          <div className="kpi-hologram-card">
            <div className="kpi-hologram-header">
              <span className="kpi-hologram-label">Operational Assets</span>
              <div className="kpi-hologram-icon teal"><Building2 size={16} /></div>
            </div>
            <div className="kpi-hologram-value">{d.operationalAssets || 0}</div>
          </div>

          <div className="kpi-hologram-card">
            <div className="kpi-hologram-header">
              <span className="kpi-hologram-label">Pending Operations</span>
              <div className="kpi-hologram-icon violet"><Zap size={16} /></div>
            </div>
            <div className="kpi-hologram-value">{d.pendingActions || 0}</div>
          </div>

          <div className="kpi-hologram-card">
            <div className="kpi-hologram-header">
              <span className="kpi-hologram-label">Average Risk</span>
              <div className="kpi-hologram-icon gold"><TrendingUp size={16} /></div>
            </div>
            <div className="kpi-hologram-value">
              {d.avgRiskScore != null ? d.avgRiskScore.toFixed(1) : '—'}
            </div>
          </div>
        </div>

        {/* 2D Matrix View — Additional Charts and Feeds */}
        {!is3DMode && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24, pointerEvents: 'auto' }}>
            {/* 30-Day Signal Timeline */}
            <div className="hud-panel">
              <div className="hud-panel-title">
                <Activity size={16} /> Signal Frequency Timeline (30d)
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={d.signalTimeline || []}>
                  <defs>
                    <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#54E7FF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#54E7FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background: '#0C1328', border: '1px solid var(--border-glass)', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#54E7FF" strokeWidth={2} fill="url(#cyanArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Distribution */}
            <div className="hud-panel">
              <div className="hud-panel-title">
                <ShieldAlert size={16} /> Severity Distribution
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={d.signalsBySeverity || []} barSize={28}>
                  <XAxis dataKey="severity" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={capitalize} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background: '#0C1328', border: '1px solid var(--border-glass)', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(d.signalsBySeverity || []).map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.severity === 'critical' ? '#FF647C' :
                          entry.severity === 'high' ? '#FB923C' :
                          entry.severity === 'moderate' ? '#FFD580' : '#4FFFC0'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Live Intelligence Feed & Recent Signals */}
        <div className="hud-panel" style={{ pointerEvents: 'auto', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="hud-panel-title" style={{ margin: 0 }}>
              <Sparkles size={16} /> Live Ingestion Stream
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Latest 10 Signals
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
            {(d.recentSignals || []).map((s) => (
              <div
                key={s.id || s._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(17, 26, 54, 0.45)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(84, 231, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => {
                  celestialAudio.playPortalChime(1.1)
                  navigate('/signals')
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        s.severity === 'critical' ? '#FF647C' :
                        s.severity === 'high' ? '#FB923C' :
                        s.severity === 'moderate' ? '#FFD580' : '#4FFFC0',
                      boxShadow: '0 0 8px currentColor',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {capitalize(s.signalType)} — {s.source?.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {timeAgo(s.observedAt)} · {s.observation?.value} {s.observation?.unit}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge-cosmic ${s.severity}`}>{s.severity}</span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Six Dimensional Worlds Portal Hub Links */}
        <div className="hud-panel" style={{ pointerEvents: 'auto' }}>
          <div className="hud-panel-title">
            <Compass size={16} /> Enter Dimensional Realms
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {WORLDS.slice(1).map((w) => {
              const Icon = w.icon
              return (
                <div
                  key={w.id}
                  style={{
                    padding: 14,
                    background: 'rgba(17, 26, 54, 0.55)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => {
                    celestialAudio.playPortalChime(1.2)
                    navigate(w.path)
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(84, 231, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--celestial-cyan)',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {w.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {w.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--celestial-cyan)" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
