import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { formatDate, capitalize } from '../utils/format'
import { Radio, ChevronLeft, ChevronRight, Plus, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const SIGNAL_TYPES = [
  'rainfall', 'flood', 'earthquake', 'landslide', 'fire',
  'wind', 'temperature', 'river_level', 'infrastructure_damage',
  'power_outage', 'road_block', 'chemical', 'other',
]
const SEVERITIES = ['low', 'moderate', 'high', 'critical']
const VERIFICATIONS = ['verified', 'unverified', 'pending', 'rejected']
const PAGE_SIZE = 15

export default function Signals() {
  const [filters, setFilters] = useState({ signalType: '', severity: '', verificationStatus: '' })
  const [page, setPage] = useState(0)
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // New signal form state
  const [formData, setFormData] = useState({
    signalType: 'rainfall',
    severity: 'moderate',
    verificationStatus: 'pending',
    sourceType: 'sensor',
    sourceName: '',
    latitude: 19.0760,
    longitude: 72.8777,
    value: 50.0,
    unit: 'mm',
    description: '',
    tags: 'monsoon, rainfall',
  })

  const params = {}
  if (filters.signalType) params.signalType = filters.signalType
  if (filters.severity) params.severity = filters.severity
  if (filters.verificationStatus) params.verificationStatus = filters.verificationStatus
  params.skip = page * PAGE_SIZE
  params.limit = PAGE_SIZE

  const { data, loading, error, refetch } = useFetch(
    () => api.listSignals(params),
    [filters.signalType, filters.severity, filters.verificationStatus, page, refreshTrigger]
  )

  const signals = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const handleCreateSignal = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const payload = {
        signalType: formData.signalType,
        severity: formData.severity,
        verificationStatus: formData.verificationStatus,
        source: {
          type: formData.sourceType,
          name: formData.sourceName || `${capitalize(formData.signalType)} Monitor`,
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
          description: formData.description || `Sensor report for ${formData.signalType}`,
        },
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        simulation: false,
      }
      await api.createSignal(payload)
      setShowCreateModal(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to create signal: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (status) => {
    if (!selectedSignal) return
    setActionLoading(true)
    try {
      const updated = await api.updateSignal(selectedSignal.id, { verificationStatus: status })
      setSelectedSignal(updated)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      {/* Filters and Actions Bar */}
      <div className="filters-bar" id="signal-filters">
        <select className="filter-select" value={filters.signalType} onChange={e => setFilter('signalType', e.target.value)}>
          <option value="">All Types</option>
          {SIGNAL_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
        </select>
        <select className="filter-select" value={filters.severity} onChange={e => setFilter('severity', e.target.value)}>
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>
        <select className="filter-select" value={filters.verificationStatus} onChange={e => setFilter('verificationStatus', e.target.value)}>
          <option value="">All Statuses</option>
          {VERIFICATIONS.map(v => <option key={v} value={v}>{capitalize(v)}</option>)}
        </select>

        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> New Signal
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {total} signals
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : error ? (
        <div className="empty-state"><p>{error}</p></div>
      ) : signals.length === 0 ? (
        <div className="empty-state">
          <Radio size={48} />
          <p>No signals found</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use the "Seed Data" button to populate demo data or click "New Signal".</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table" id="signals-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Observation</th>
                <th>Observed At</th>
              </tr>
            </thead>
            <tbody>
              {signals.map(s => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedSignal(s)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view full details and update status"
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{capitalize(s.signalType)}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{s.source?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.source?.type}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {s.location?.coordinates?.[1]?.toFixed(3)}°N, {s.location?.coordinates?.[0]?.toFixed(3)}°E
                  </td>
                  <td><span className={`badge ${s.severity}`}>{s.severity}</span></td>
                  <td><span className={`badge ${s.verificationStatus}`}>{s.verificationStatus}</span></td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.observation?.value}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{s.observation?.unit}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(s.observedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              <span className="page-info">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Signal Details Modal */}
      {selectedSignal && (
        <div className="modal-backdrop" onClick={() => setSelectedSignal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Radio size={20} color="var(--accent)" />
                <span>{capitalize(selectedSignal.signalType)} Signal Details</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSignal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Signal ID</span>
                <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>{selectedSignal.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Severity</span>
                <span className={`badge ${selectedSignal.severity}`}>{selectedSignal.severity}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Verification Status</span>
                <span className={`badge ${selectedSignal.verificationStatus}`}>{selectedSignal.verificationStatus}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Observation Value</span>
                <span className="detail-val">
                  {selectedSignal.observation?.value} {selectedSignal.observation?.unit}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Observation Summary</span>
                <span className="detail-val">{selectedSignal.observation?.description || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Sensor / Source</span>
                <span className="detail-val">
                  {selectedSignal.source?.name} ({selectedSignal.source?.type})
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Geospatial Coordinates</span>
                <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  [{selectedSignal.location?.coordinates?.[0]}, {selectedSignal.location?.coordinates?.[1]}]
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Observed At</span>
                <span className="detail-val">{formatDate(selectedSignal.observedAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tags</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(selectedSignal.tags || []).map(t => (
                    <span key={t} className="badge detected" style={{ fontSize: '0.65rem' }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Status Update Actions */}
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  VERIFY OR REJECT SIGNAL
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={actionLoading || selectedSignal.verificationStatus === 'verified'}
                    onClick={() => handleUpdateStatus('verified')}
                  >
                    <CheckCircle2 size={14} /> Mark Verified
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={actionLoading || selectedSignal.verificationStatus === 'rejected'}
                    onClick={() => handleUpdateStatus('rejected')}
                  >
                    <AlertCircle size={14} /> Mark Rejected
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={actionLoading || selectedSignal.verificationStatus === 'pending'}
                    onClick={() => handleUpdateStatus('pending')}
                  >
                    <Clock size={14} /> Set Pending
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSignal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Signal Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateSignal}>
              <div className="modal-header">
                <div className="modal-title">
                  <Plus size={20} color="var(--accent)" />
                  <span>Register New Disaster Signal</span>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Signal Type</label>
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
                    <label className="form-label">Source Type</label>
                    <select
                      className="form-select"
                      value={formData.sourceType}
                      onChange={e => setFormData({ ...formData, sourceType: e.target.value })}
                    >
                      <option value="sensor">Sensor</option>
                      <option value="satellite">Satellite</option>
                      <option value="citizen">Citizen</option>
                      <option value="model">Prediction Model</option>
                      <option value="manual">Manual Entry</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Source / Station Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Mumbai Coastal Doppler Station"
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
                    <label className="form-label">Reading Value</label>
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
                  <label className="form-label">Observation Notes</label>
                  <input
                    className="form-input"
                    placeholder="Brief description of telemetry or situation"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    className="form-input"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                  {actionLoading ? 'Broadcasting…' : 'Broadcast Signal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
