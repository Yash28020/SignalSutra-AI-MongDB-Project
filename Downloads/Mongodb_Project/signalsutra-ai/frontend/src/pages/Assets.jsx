import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { formatDate, capitalize } from '../utils/format'
import { Building2, ChevronLeft, ChevronRight, Plus, X, MapPin, Phone } from 'lucide-react'

const ASSET_TYPES = [
  'hospital', 'fire_station', 'police_station', 'shelter',
  'bridge', 'dam', 'power_plant', 'water_treatment',
  'communication_tower', 'warehouse', 'helipad', 'other',
]
const STATUSES = ['operational', 'partial', 'offline', 'destroyed']
const PAGE_SIZE = 15

export default function Assets() {
  const [assetType, setAssetType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // New asset form state
  const [formData, setFormData] = useState({
    name: '',
    assetType: 'hospital',
    availabilityStatus: 'operational',
    capacity: 250,
    contactInfo: '+91-9876543210',
    latitude: 19.0760,
    longitude: 72.8777,
    tags: 'emergency, facility',
  })

  const params = {}
  if (assetType) params.assetType = assetType
  if (status) params.status = status
  params.skip = page * PAGE_SIZE
  params.limit = PAGE_SIZE

  const { data, loading, error } = useFetch(
    () => api.listAssets(params),
    [assetType, status, page, refreshTrigger]
  )

  const assets = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleCreateAsset = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const payload = {
        name: formData.name,
        assetType: formData.assetType,
        availabilityStatus: formData.availabilityStatus,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
        contactInfo: formData.contactInfo,
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        },
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      await api.createAsset(payload)
      setShowCreateModal(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to register asset: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedAsset) return
    setActionLoading(true)
    try {
      const updated = await api.updateAsset(selectedAsset.id, { availabilityStatus: newStatus })
      setSelectedAsset(updated)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="filters-bar" id="asset-filters">
        <select className="filter-select" value={assetType} onChange={e => { setAssetType(e.target.value); setPage(0) }}>
          <option value="">All Types</option>
          {ASSET_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>

        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> Register Asset
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {total} assets
        </span>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : error ? (
        <div className="empty-state"><p>{error}</p></div>
      ) : assets.length === 0 ? (
        <div className="empty-state"><Building2 size={48} /><p>No assets found</p></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table" id="assets-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Contact</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAsset(a)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view asset readiness and update status"
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                  <td>{capitalize(a.assetType)}</td>
                  <td><span className={`badge ${a.availabilityStatus}`}>{capitalize(a.availabilityStatus)}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {a.location?.coordinates?.[1]?.toFixed(3)}°N, {a.location?.coordinates?.[0]?.toFixed(3)}°E
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{a.capacity ?? '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{a.contactInfo || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

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

      {/* Asset Details Modal */}
      {selectedAsset && (
        <div className="modal-backdrop" onClick={() => setSelectedAsset(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Building2 size={20} color="var(--accent)" />
                <span>{selectedAsset.name}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAsset(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Asset ID</span>
                <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>{selectedAsset.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Classification</span>
                <span className="detail-val">{capitalize(selectedAsset.assetType)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Readiness Status</span>
                <span className={`badge ${selectedAsset.availabilityStatus}`}>{capitalize(selectedAsset.availabilityStatus)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Operational Capacity</span>
                <span className="detail-val">{selectedAsset.capacity ? `${selectedAsset.capacity} units / beds` : 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Emergency Hotline</span>
                <span className="detail-val">{selectedAsset.contactInfo || 'Not specified'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Geographic Coordinates</span>
                <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  [{selectedAsset.location?.coordinates?.[0]}, {selectedAsset.location?.coordinates?.[1]}]
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tags</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(selectedAsset.tags || []).map(t => (
                    <span key={t} className="badge detected" style={{ fontSize: '0.65rem' }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Status Controller */}
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  TOGGLE OPERATIONAL AVAILABILITY
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUSES.map(st => (
                    <button
                      key={st}
                      className={`btn btn-sm ${selectedAsset.availabilityStatus === st ? 'btn-primary' : 'btn-ghost'}`}
                      disabled={actionLoading || selectedAsset.availabilityStatus === st}
                      onClick={() => handleUpdateStatus(st)}
                    >
                      {capitalize(st)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAsset(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Asset Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateAsset}>
              <div className="modal-header">
                <div className="modal-title">
                  <Building2 size={20} color="var(--accent)" />
                  <span>Register Critical Infrastructure Asset</span>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Asset / Facility Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Apex Multi-Specialty Trauma Center"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Asset Classification</label>
                    <select
                      className="form-select"
                      value={formData.assetType}
                      onChange={e => setFormData({ ...formData, assetType: e.target.value })}
                    >
                      {ASSET_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-select"
                      value={formData.availabilityStatus}
                      onChange={e => setFormData({ ...formData, availabilityStatus: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacity (Beds/Slots)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact / Emergency Phone</label>
                    <input
                      className="form-input"
                      value={formData.contactInfo}
                      onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
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
                  {actionLoading ? 'Registering…' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
