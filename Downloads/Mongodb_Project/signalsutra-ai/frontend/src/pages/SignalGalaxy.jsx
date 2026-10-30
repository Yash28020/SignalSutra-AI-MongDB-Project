import { useState, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { formatDate, capitalize, timeAgo } from '../utils/format'
import GalaxyScene from '../components/3d/GalaxyScene'
import { celestialAudio } from '../components/universe/CelestialAudio'
import {
  Radio,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Trash2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  MapPin,
  Tag,
} from 'lucide-react'

const SIGNAL_TYPES = [
  'rainfall', 'flood', 'earthquake', 'landslide', 'fire',
  'wind', 'temperature', 'river_level', 'infrastructure_damage',
  'power_outage', 'road_block', 'chemical', 'other',
]
const SEVERITIES = ['low', 'moderate', 'high', 'critical']
const VERIFICATIONS = ['verified', 'unverified', 'pending', 'rejected']
const PAGE_SIZE = 15

export default function SignalGalaxy({ is3DMode, searchQuery }) {
  const [filters, setFilters] = useState({ signalType: '', severity: '', verificationStatus: '' })
  const [page, setPage] = useState(0)
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // New Signal Form State
  const [formData, setFormData] = useState({
    signalType: 'rainfall',
    severity: 'moderate',
    verificationStatus: 'pending',
    sourceType: 'sensor',
    sourceName: '',
    latitude: 19.0760,
    longitude: 72.8777,
    value: 45.0,
    unit: 'mm',
    description: '',
    tags: 'monsoon, rainfall',
  })

  const params = useMemo(() => {
    const p = {}
    if (filters.signalType) p.signalType = filters.signalType
    if (filters.severity) p.severity = filters.severity
    if (filters.verificationStatus) p.verificationStatus = filters.verificationStatus
    p.skip = page * PAGE_SIZE
    p.limit = is3DMode ? 100 : PAGE_SIZE
    return p
  }, [filters, page, is3DMode])

  const { data, loading, error, refetch } = useFetch(
    () => api.listSignals(params),
    [filters.signalType, filters.severity, filters.verificationStatus, page, is3DMode, refreshTrigger]
  )

  const rawSignals = data?.data || []
  // Apply search query filter
  const signals = useMemo(() => {
    if (!searchQuery) return rawSignals
    const q = searchQuery.toLowerCase()
    return rawSignals.filter(s =>
      s.signalType?.toLowerCase().includes(q) ||
      s.source?.name?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q) ||
      s.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [rawSignals, searchQuery])

  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleSelectSignal = (signal) => {
    celestialAudio.playNodeBeep(signal.severity)
    setSelectedSignal(signal)
  }

  const handleCreateSignal = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    celestialAudio.playPortalChime(1.3)
    try {
      const payload = {
        signalType: formData.signalType,
        severity: formData.severity,
        verificationStatus: formData.verificationStatus,
        source: {
          type: formData.sourceType,
          name: formData.sourceName || `${capitalize(formData.signalType)} Observation Station`,
          sourceId: `SRC-${Math.floor(1000 + Math.random() * 9000)}`,
        },
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        },
        observedAt: new Date().toISOString(),
        observation: {
          value: parseFloat(formData.value),
          unit: formData.unit,
          description: formData.description || `Cosmic telemetry for ${formData.signalType}`,
        },
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        simulation: false,
      }
      await api.createSignal(payload)
      setShowCreateModal(false)
      setRefreshTrigger(prev => prev + 1)
      window.dispatchEvent(new CustomEvent('signalsutra:refresh'))
    } catch (err) {
      alert(`Failed to broadcast signal: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedSignal) return
    setActionLoading(true)
    celestialAudio.playNodeBeep(selectedSignal.severity)
    try {
      const updated = await api.updateSignal(selectedSignal.id, { verificationStatus: newStatus })
      setSelectedSignal(updated)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Status update failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSignal = async () => {
    if (!selectedSignal) return
    if (!window.confirm('Delete this signal record from MongoDB?')) return
    setActionLoading(true)
    try {
      await api.deleteSignal(selectedSignal.id)
      setSelectedSignal(null)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── 3D Constellation Galaxy Scene ──────────────────────────────── */}
      {is3DMode && (
        <GalaxyScene
          signals={signals}
          selectedSignal={selectedSignal}
          onSelectSignal={handleSelectSignal}
        />
      )}

      {/* ── Filter HUD Toolbar ────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 24,
          right: 24,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          background: 'rgba(12, 19, 40, 0.75)',
          backdropFilter: 'blur(20px)',
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} color="var(--celestial-cyan)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '0.05em' }}>
            CONSTELLATION FILTERS:
          </span>
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '5px 12px', fontSize: '0.78rem' }}
          value={filters.signalType}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, signalType: e.target.value }))
            setPage(0)
          }}
        >
          <option value="">All Signal Spectra</option>
          {SIGNAL_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '5px 12px', fontSize: '0.78rem' }}
          value={filters.severity}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, severity: e.target.value }))
            setPage(0)
          }}
        >
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '5px 12px', fontSize: '0.78rem' }}
          value={filters.verificationStatus}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))
            setPage(0)
          }}
        >
          <option value="">All Verification States</option>
          {VERIFICATIONS.map(v => <option key={v} value={v}>{capitalize(v)}</option>)}
        </select>

        <button
          className="btn-celestial btn-celestial-primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            celestialAudio.playPortalChime(1.1)
            setShowCreateModal(true)
          }}
        >
          <Plus size={14} /> Transmit Signal
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {total} nodes in galaxy
        </span>
      </div>

      {/* ── 2D Mode Telemetry Grid View ─────────────────────────────────── */}
      {!is3DMode && (
        <div className="world-content-scrollable" style={{ paddingTop: 76 }}>
          {loading ? (
            <div className="cosmic-loading-orb"><div className="nebula-spinner" /></div>
          ) : error ? (
            <div className="cosmic-empty-state"><p>{error}</p></div>
          ) : signals.length === 0 ? (
            <div className="cosmic-empty-state">
              <Radio size={48} className="cosmic-empty-icon" />
              <p>No signal telemetry found for active filters.</p>
            </div>
          ) : (
            <div className="cosmic-table-container">
              <table className="cosmic-table">
                <thead>
                  <tr>
                    <th>Signal Category</th>
                    <th>Sensor / Station</th>
                    <th>Coordinates</th>
                    <th>Severity</th>
                    <th>Verification</th>
                    <th>Observation</th>
                    <th>Observed Time</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map(s => (
                    <tr
                      key={s.id || s._id}
                      onClick={() => handleSelectSignal(s)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                        {capitalize(s.signalType)}
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)' }}>{s.source?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.source?.type}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {s.location?.coordinates?.[1]?.toFixed(3)}°N, {s.location?.coordinates?.[0]?.toFixed(3)}°E
                      </td>
                      <td><span className={`badge-cosmic ${s.severity}`}>{s.severity}</span></td>
                      <td><span className={`badge-cosmic ${s.verificationStatus}`}>{s.verificationStatus}</span></td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--celestial-cyan)' }}>
                          {s.observation?.value}
                        </span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{s.observation?.unit}</span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(s.observedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '12px 18px' }}>
                  <button className="btn-celestial" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button className="btn-celestial" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Signal Detail Contextual Floating Panel ─────────────────────── */}
      {selectedSignal && (
        <div
          style={{
            position: 'absolute',
            top: 80,
            right: 24,
            width: 380,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 40,
            background: 'var(--bg-glass-elevated)',
            backdropFilter: 'blur(28px)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 24px var(--cyan-glow)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'cosmicZoomIn 0.25s cubic-bezier(.16, 1, .3, 1)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={18} color="var(--celestial-cyan)" />
              <span style={{ fontWeight: 800, color: 'var(--text-heading)', fontSize: '0.95rem' }}>
                {capitalize(selectedSignal.signalType)} Node Dossier
              </span>
            </div>
            <button className="btn-celestial" style={{ padding: 4 }} onClick={() => setSelectedSignal(null)}>
              <X size={14} />
            </button>
          </div>

          <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="detail-row">
              <span className="detail-label">Node Identifier</span>
              <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>{selectedSignal.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Severity Index</span>
              <span className={`badge-cosmic ${selectedSignal.severity}`}>{selectedSignal.severity}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Verification State</span>
              <span className={`badge-cosmic ${selectedSignal.verificationStatus}`}>{selectedSignal.verificationStatus}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Measurement</span>
              <span className="detail-val" style={{ color: 'var(--celestial-cyan)' }}>
                {selectedSignal.observation?.value} {selectedSignal.observation?.unit}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Source Station</span>
              <span className="detail-val">{selectedSignal.source?.name} ({selectedSignal.source?.type})</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Coordinates</span>
              <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>
                [{selectedSignal.location?.coordinates?.[0]?.toFixed(4)}, {selectedSignal.location?.coordinates?.[1]?.toFixed(4)}]
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Observation Time</span>
              <span className="detail-val">{formatDate(selectedSignal.observedAt)}</span>
            </div>

            {/* Verification Status Controls */}
            <div style={{ marginTop: 8, padding: 12, background: 'rgba(12, 19, 40, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
                VERIFICATION AUDIT ACTION
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-celestial btn-celestial-primary"
                  style={{ flex: 1, padding: '5px 8px', fontSize: '0.72rem' }}
                  disabled={actionLoading || selectedSignal.verificationStatus === 'verified'}
                  onClick={() => handleUpdateStatus('verified')}
                >
                  <CheckCircle2 size={12} /> Verify
                </button>
                <button
                  className="btn-celestial"
                  style={{ flex: 1, padding: '5px 8px', fontSize: '0.72rem', color: 'var(--critical-coral)' }}
                  disabled={actionLoading || selectedSignal.verificationStatus === 'rejected'}
                  onClick={() => handleUpdateStatus('rejected')}
                >
                  <AlertCircle size={12} /> Reject
                </button>
              </div>
            </div>

            {/* Record Deletion */}
            <button
              className="btn-celestial"
              style={{ color: 'var(--critical-coral)', justifyContent: 'center' }}
              onClick={handleDeleteSignal}
              disabled={actionLoading}
            >
              <Trash2 size={13} /> Purge Record From MongoDB
            </button>
          </div>
        </div>
      )}

      {/* ── Transmit Signal Modal (Create Signal Form) ───────────────────── */}
      {showCreateModal && (
        <div className="cosmic-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="cosmic-modal-card" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateSignal}>
              <div className="cosmic-modal-header">
                <div className="cosmic-modal-title">
                  <Sparkles size={18} color="var(--celestial-cyan)" />
                  <span>Transmit New Telemetry Signal to Cosmos</span>
                </div>
                <button type="button" className="btn-celestial" onClick={() => setShowCreateModal(false)}>
                  <X size={14} />
                </button>
              </div>

              <div className="cosmic-modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Signal Category</label>
                    <select
                      className="form-select"
                      value={formData.signalType}
                      onChange={e => setFormData({ ...formData, signalType: e.target.value })}
                    >
                      {SIGNAL_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity Level</label>
                    <select
                      className="form-select"
                      value={formData.severity}
                      onChange={e => setFormData({ ...formData, severity: e.target.value })}
                    >
                      {SEVERITIES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Source Classification</label>
                    <select
                      className="form-select"
                      value={formData.sourceType}
                      onChange={e => setFormData({ ...formData, sourceType: e.target.value })}
                    >
                      <option value="sensor">Sensor Array</option>
                      <option value="satellite">Orbital Satellite</option>
                      <option value="citizen">Citizen Field Report</option>
                      <option value="model">Predictive AI Model</option>
                      <option value="manual">Command Override</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Station / Reporter Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Pune River Stage Radar #4"
                      value={formData.sourceName}
                      onChange={e => setFormData({ ...formData, sourceName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Latitude (°N)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude (°E)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Observation Value</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.value}
                      onChange={e => setFormData({ ...formData, value: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit of Measure</label>
                    <input
                      className="form-input"
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observation Briefing</label>
                  <input
                    className="form-input"
                    placeholder="Telemetry notes and context..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="cosmic-modal-footer">
                <button type="button" className="btn-celestial" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-celestial btn-celestial-primary" disabled={actionLoading}>
                  {actionLoading ? 'Broadcasting…' : 'Transmit to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
