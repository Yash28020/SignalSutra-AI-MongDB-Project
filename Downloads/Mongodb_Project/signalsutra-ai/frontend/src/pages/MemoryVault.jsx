import { useState, useEffect, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { capitalize, formatDate, timeAgo } from '../utils/format'
import { celestialAudio } from '../components/universe/CelestialAudio'
import {
  Library,
  History,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Search,
  Filter,
  Activity,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'

const PIE_COLORS = [
  '#54E7FF', '#A78BFA', '#4FFFC0', '#FFD580', '#FF647C',
  '#38BDF8', '#818CF8', '#34D399', '#FBBF24', '#F43F5E',
]

export default function MemoryVault() {
  const [activeTab, setActiveTab] = useState('analytics') // analytics | archive | replay | quality

  // Fetch Dashboard Stats, Incidents, Signals, and Health
  const { data: dashData, loading: dashLoading } = useFetch(() => api.dashboard(), [])
  const { data: incData } = useFetch(() => api.listIncidents({ limit: 50 }), [])
  const { data: sigData } = useFetch(() => api.listSignals({ limit: 100 }), [])
  const { data: healthData } = useFetch(() => api.health(), [])

  const dash = dashData || {}
  const incidents = incData?.data || []
  const signals = sigData?.data || []

  // ── Scenario Replay State ──────────────────────────────────────────
  const [replayIndex, setReplayIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [replaySpeed, setReplaySpeed] = useState(1) // 1x, 2x, 5x

  const timelineEvents = useMemo(() => {
    // Sort combined signals & incidents by observedAt / createdAt
    return [...signals].sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt))
  }, [signals])

  useEffect(() => {
    let timer
    if (isPlaying && timelineEvents.length > 0) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= timelineEvents.length - 1) {
            setIsPlaying(false)
            return prev
          }
          celestialAudio.playNodeBeep('low')
          return prev + 1
        })
      }, 1000 / replaySpeed)
    }
    return () => clearInterval(timer)
  }, [isPlaying, replaySpeed, timelineEvents])

  // ── Data Quality Monitoring Audit ──────────────────────────────────
  const dataQualityAudit = useMemo(() => {
    let missingCoords = 0
    let unverifiedCount = 0
    let invalidValues = 0

    signals.forEach((s) => {
      if (!s.location?.coordinates || s.location.coordinates.length !== 2) missingCoords++
      if (s.verificationStatus === 'unverified' || s.verificationStatus === 'pending') unverifiedCount++
      if (s.observation?.value == null || isNaN(s.observation.value)) invalidValues++
    })

    const total = signals.length || 1
    const healthScore = Math.max(0, Math.round(100 - (missingCoords * 10 + invalidValues * 15 + (unverifiedCount / total) * 20)))

    return {
      healthScore,
      missingCoords,
      unverifiedCount,
      invalidValues,
      totalChecked: signals.length,
      status: healthScore > 85 ? 'OPTIMAL' : 'ATTENTION REQUIRED',
    }
  }, [signals])

  // ── Historical Incident Search Filter ──────────────────────────────
  const [archiveSearch, setArchiveSearch] = useState('')
  const filteredIncidents = useMemo(() => {
    if (!archiveSearch) return incidents
    const q = archiveSearch.toLowerCase()
    return incidents.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.incidentType.toLowerCase().includes(q) ||
      i.region?.name.toLowerCase().includes(q)
    )
  }, [incidents, archiveSearch])

  return (
    <div className="world-content-scrollable">
      {/* ── Subheader Navigation Tabs ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          background: 'var(--bg-glass-card)',
          backdropFilter: 'blur(20px)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Library size={18} color="var(--starlight-gold)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            The Celestial Memory Vault & Analytical Archive
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn-celestial ${activeTab === 'analytics' ? 'btn-celestial-primary' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Cosmic Analytics
          </button>
          <button
            className={`btn-celestial ${activeTab === 'archive' ? 'btn-celestial-primary' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            Incident Archive ({incidents.length})
          </button>
          <button
            className={`btn-celestial ${activeTab === 'replay' ? 'btn-celestial-primary' : ''}`}
            onClick={() => setActiveTab('replay')}
          >
            Scenario Replay
          </button>
          <button
            className={`btn-celestial ${activeTab === 'quality' ? 'btn-celestial-primary' : ''}`}
            onClick={() => setActiveTab('quality')}
          >
            Data Quality ({dataQualityAudit.healthScore}%)
          </button>
        </div>
      </div>

      {/* ── Tab 1: Cosmic Analytics (MongoDB Aggregation Pipelines) ───── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {/* Signal Category Spectrum Donut */}
          <div className="hud-panel">
            <div className="hud-panel-title">
              <Sparkles size={16} /> Signal Category Spectrum
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={dash.signalsByType || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(dash.signalsByType || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0C1328', border: '1px solid var(--border-glass)', borderRadius: 10, fontSize: 12 }}
                  formatter={(val, name) => [val, capitalize(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Incident Status Aggregation */}
          <div className="hud-panel">
            <div className="hud-panel-title">
              <Activity size={16} /> Incident Lifecycle Breakdown
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dash.incidentsByStatus || []} barSize={28}>
                <XAxis dataKey="status" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={capitalize} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: '#0C1328', border: '1px solid var(--border-glass)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(dash.incidentsByStatus || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 2: Historical Incident Archive Explorer ───────────────── */}
      {activeTab === 'archive' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
            <div className="topbar-search" style={{ margin: 0, width: 320 }}>
              <Search size={14} className="topbar-search-icon" />
              <input
                type="text"
                className="topbar-search-input"
                style={{ width: '100%' }}
                placeholder="Filter archived incidents by title, type, city..."
                value={archiveSearch}
                onChange={e => setArchiveSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="cosmic-table-container">
            <table className="cosmic-table">
              <thead>
                <tr>
                  <th>Incident Record</th>
                  <th>Hazard Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Region & Zone</th>
                  <th>Linked Signals</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                      {inc.title}
                    </td>
                    <td>{capitalize(inc.incidentType)}</td>
                    <td><span className={`badge-cosmic ${inc.severity}`}>{inc.severity}</span></td>
                    <td><span className={`badge-cosmic ${inc.status}`}>{capitalize(inc.status)}</span></td>
                    <td>{inc.region?.name} ({inc.region?.radiusKm} km)</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{inc.linkedSignalIds?.length || 0}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(inc.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Scenario Replay Machine ────────────────────────────── */}
      {activeTab === 'replay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Replay Controller Deck */}
          <div className="hud-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                className="btn-celestial btn-celestial-primary"
                onClick={() => {
                  celestialAudio.playPortalChime(isPlaying ? 0.9 : 1.3)
                  setIsPlaying(!isPlaying)
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause Replay' : 'Play Scenario'}</span>
              </button>

              <button
                className="btn-celestial"
                onClick={() => {
                  setReplayIndex(0)
                  setIsPlaying(false)
                }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>

              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 5].map(spd => (
                  <button
                    key={spd}
                    className={`btn-celestial ${replaySpeed === spd ? 'btn-celestial-primary' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                    onClick={() => setReplaySpeed(spd)}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--celestial-cyan)' }}>
              Step {replayIndex + 1} of {timelineEvents.length}
            </div>
          </div>

          {/* Time Scrubber Slider */}
          <div className="hud-panel" style={{ padding: '16px 24px' }}>
            <input
              type="range"
              min="0"
              max={Math.max(0, timelineEvents.length - 1)}
              value={replayIndex}
              onChange={e => setReplayIndex(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--celestial-cyan)', cursor: 'pointer' }}
            />
          </div>

          {/* Current Scrubbed Event Dossier */}
          {timelineEvents[replayIndex] && (
            <div className="hud-panel">
              <div className="hud-panel-title">
                <History size={16} /> Replayed Event Snapshot #{replayIndex + 1}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div className="detail-row">
                  <span className="detail-label">Signal Category</span>
                  <span className="detail-val">{capitalize(timelineEvents[replayIndex].signalType)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Severity</span>
                  <span className={`badge-cosmic ${timelineEvents[replayIndex].severity}`}>{timelineEvents[replayIndex].severity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Telemetry Reading</span>
                  <span className="detail-val" style={{ color: 'var(--celestial-cyan)' }}>
                    {timelineEvents[replayIndex].observation?.value} {timelineEvents[replayIndex].observation?.unit}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Origin Station</span>
                  <span className="detail-val">{timelineEvents[replayIndex].source?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Observed Timestamp</span>
                  <span className="detail-val">{formatDate(timelineEvents[replayIndex].observedAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Data-Quality Monitor & Ingestion Health ────────────── */}
      {activeTab === 'quality' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          <div className="hud-panel">
            <div className="hud-panel-title">
              <ShieldCheck size={16} /> Data Integrity & Health Score
            </div>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--magical-teal)', fontFamily: 'var(--font-mono)' }}>
                {dataQualityAudit.healthScore}%
              </div>
              <div className="badge-cosmic low" style={{ marginTop: 8 }}>
                {dataQualityAudit.status}
              </div>
            </div>
          </div>

          <div className="hud-panel">
            <div className="hud-panel-title">
              <FileCheck size={16} /> Telemetry Validation Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="detail-row">
                <span className="detail-label">Total Signals Audited</span>
                <span className="detail-val">{dataQualityAudit.totalChecked}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Missing Geographic Coordinates</span>
                <span className="detail-val" style={{ color: dataQualityAudit.missingCoords > 0 ? 'var(--critical-coral)' : 'var(--magical-teal)' }}>
                  {dataQualityAudit.missingCoords}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pending / Unverified Reports</span>
                <span className="detail-val" style={{ color: 'var(--starlight-gold)' }}>
                  {dataQualityAudit.unverifiedCount}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Database Connection</span>
                <span className="detail-val" style={{ color: 'var(--magical-teal)' }}>
                  {healthData?.database === 'connected' ? 'CONNECTED' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
