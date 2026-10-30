import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { formatDate, capitalize, timeAgo } from '../utils/format'
import { AlertTriangle, MapPin, Clock, Link2, Plus, X, CheckCircle2, ShieldAlert } from 'lucide-react'

const SEVERITIES = ['low', 'moderate', 'high', 'critical']
const STATUSES = ['detected', 'monitoring', 'active', 'contained', 'resolved']
const INCIDENT_TYPES = [
  'flood', 'earthquake', 'landslide', 'fire', 'cyclone',
  'industrial', 'infrastructure', 'multi_hazard',
]

export default function Incidents() {
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // New incident form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incidentType: 'flood',
    severity: 'high',
    status: 'active',
    regionName: 'Mumbai Urban Core',
    latitude: 19.0760,
    longitude: 72.8777,
    radiusKm: 25.0,
  })

  const params = {}
  if (severity) params.severity = severity
  if (status) params.status = status
  params.limit = 50

  const { data, loading, error } = useFetch(
    () => api.listIncidents(params),
    [severity, status, refreshTrigger]
  )

  const incidents = data?.data || []

  const handleCreateIncident = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        incidentType: formData.incidentType,
        severity: formData.severity,
        status: formData.status,
        region: {
          name: formData.regionName,
          center: {
            type: 'Point',
            coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
          },
          radiusKm: parseFloat(formData.radiusKm),
        },
        linkedSignalIds: [],
        simulation: false,
      }
      await api.createIncident(payload)
      setShowCreateModal(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to create incident: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedIncident) return
    setActionLoading(true)
    try {
      const updated = await api.updateIncident(selectedIncident.id, { status: newStatus })
      setSelectedIncident(updated)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to update incident: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      {/* Filters and Actions */}
      <div className="filters-bar" id="incident-filters">
        <select className="filter-select" value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>

        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> Declare Incident
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {data?.total || 0} incidents
        </span>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : error ? (
        <div className="empty-state"><p>{error}</p></div>
      ) : incidents.length === 0 ? (
        <div className="empty-state"><AlertTriangle size={48} /><p>No incidents found</p></div>
      ) : (
        <div className="incidents-grid" id="incidents-grid">
          {incidents.map(inc => (
            <div
              className="incident-card"
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              style={{ cursor: 'pointer' }}
              title="Click to view details and manage incident"
            >
              <div className="incident-card-header">
                <h3 className="incident-card-title">{inc.title}</h3>
              </div>
              <div className="incident-card-meta">
                <span className={`badge ${inc.severity}`}>{inc.severity}</span>
                <span className={`badge ${inc.status}`}>{capitalize(inc.status)}</span>
                <span className={`badge detected`}>{capitalize(inc.incidentType)}</span>
              </div>
              <p className="incident-card-desc">{inc.description}</p>
              <div className="incident-card-footer">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} />
                  {inc.region?.name} ({inc.region?.radiusKm} km)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Link2 size={12} />
                  {inc.linkedSignalIds?.length || 0} signals
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} />
                  {timeAgo(inc.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="modal-backdrop" onClick={() => setSelectedIncident(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <AlertTriangle size={20} color="var(--warning)" />
                <span>Incident Response Dossier</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIncident(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Incident ID</span>
                <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>{selectedIncident.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Title</span>
                <span className="detail-val">{selectedIncident.title}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type / Category</span>
                <span className="detail-val">{capitalize(selectedIncident.incidentType)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Severity Level</span>
                <span className={`badge ${selectedIncident.severity}`}>{selectedIncident.severity}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Status</span>
                <span className={`badge ${selectedIncident.status}`}>{capitalize(selectedIncident.status)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Region Name & Radius</span>
                <span className="detail-val">
                  {selectedIncident.region?.name} ({selectedIncident.region?.radiusKm} km zone)
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Center Point</span>
                <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  [{selectedIncident.region?.center?.coordinates?.[0]}, {selectedIncident.region?.center?.coordinates?.[1]}]
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Correlated Signals</span>
                <span className="detail-val">{selectedIncident.linkedSignalIds?.length || 0} signals linked</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-val" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{selectedIncident.description}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated</span>
                <span className="detail-val">{formatDate(selectedIncident.updatedAt)}</span>
              </div>

              {/* Status Workflow Controller */}
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  ESCALATION & CONTAINMENT STATUS WORKFLOW
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUSES.map(st => (
                    <button
                      key={st}
                      className={`btn btn-sm ${selectedIncident.status === st ? 'btn-primary' : 'btn-ghost'}`}
                      disabled={actionLoading || selectedIncident.status === st}
                      onClick={() => handleUpdateStatus(st)}
                    >
                      {capitalize(st)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIncident(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateIncident}>
              <div className="modal-header">
                <div className="modal-title">
                  <ShieldAlert size={20} color="var(--danger)" />
                  <span>Declare Emergency Incident</span>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Incident Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Urban Flash Flood Escalation — Thane Basin"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hazard Type</label>
                    <select
                      className="form-select"
                      value={formData.incidentType}
                      onChange={e => setFormData({ ...formData, incidentType: e.target.value })}
                    >
                      {INCIDENT_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
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
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Region / Zone Name</label>
                    <input
                      className="form-input"
                      value={formData.regionName}
                      onChange={e => setFormData({ ...formData, regionName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Center Latitude (°N)</label>
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
                    <label className="form-label">Center Longitude (°E)</label>
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

                <div className="form-group">
                  <label className="form-label">Impact Radius (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={formData.radiusKm}
                    onChange={e => setFormData({ ...formData, radiusKm: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Situation Description</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Brief description of the developing hazard and threat assessment..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                  {actionLoading ? 'Declaring…' : 'Declare Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
