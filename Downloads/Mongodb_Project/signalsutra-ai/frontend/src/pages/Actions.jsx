import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { formatDate, capitalize } from '../utils/format'
import { Zap, ChevronLeft, ChevronRight, Plus, X, CheckCircle2, PlayCircle, Clock } from 'lucide-react'

const STATUSES = ['planned', 'in_progress', 'completed', 'cancelled']
const PRIORITIES = ['low', 'medium', 'high', 'critical']
const ACTION_TYPES = [
  'evacuate', 'deploy_team', 'distribute_supplies',
  'medical_response', 'infrastructure_repair',
  'communication', 'search_rescue', 'other',
]
const PAGE_SIZE = 15

export default function Actions() {
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(0)
  const [selectedAction, setSelectedAction] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // New action form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    actionType: 'deploy_team',
    priority: 'high',
    status: 'planned',
    assignedTo: 'NDRF Quick Reaction Team Alpha',
    estimatedDurationMinutes: 120,
    incidentId: '',
  })

  const params = {}
  if (status) params.status = status
  if (priority) params.priority = priority
  params.skip = page * PAGE_SIZE
  params.limit = PAGE_SIZE

  const { data, loading, error } = useFetch(
    () => api.listActions(params),
    [status, priority, page, refreshTrigger]
  )

  const actions = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleCreateAction = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      // If incidentId is blank, fetch one from active incidents
      let incId = formData.incidentId
      if (!incId) {
        const incRes = await api.listIncidents({ limit: 1 })
        incId = incRes?.data?.[0]?.id || 'GEN-INCIDENT'
      }

      const payload = {
        incidentId: incId,
        title: formData.title,
        description: formData.description,
        actionType: formData.actionType,
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo,
        estimatedDurationMinutes: parseInt(formData.estimatedDurationMinutes, 10),
        linkedAssetIds: [],
      }
      await api.createAction(payload)
      setShowCreateModal(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to deploy action: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedAction) return
    setActionLoading(true)
    try {
      const updated = await api.updateAction(selectedAction.id, { status: newStatus })
      setSelectedAction(updated)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="filters-bar" id="action-filters">
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>
        <select className="filter-select" value={priority} onChange={e => { setPriority(e.target.value); setPage(0) }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{capitalize(p)}</option>)}
        </select>

        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> Deploy Action
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {total} actions
        </span>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : error ? (
        <div className="empty-state"><p>{error}</p></div>
      ) : actions.length === 0 ? (
        <div className="empty-state"><Zap size={48} /><p>No response actions found</p></div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table" id="actions-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Duration</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAction(a)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view action dispatch details"
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title}
                  </td>
                  <td>{capitalize(a.actionType)}</td>
                  <td><span className={`badge ${a.priority}`}>{capitalize(a.priority)}</span></td>
                  <td><span className={`badge ${a.status}`}>{capitalize(a.status)}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{a.assignedTo || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {a.estimatedDurationMinutes ? `${a.estimatedDurationMinutes}m` : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(a.createdAt)}</td>
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

      {/* Action Details Modal */}
      {selectedAction && (
        <div className="modal-backdrop" onClick={() => setSelectedAction(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Zap size={20} color="var(--accent)" />
                <span>Response Operation Task #{selectedAction.id.slice(-6)}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAction(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Action Title</span>
                <span className="detail-val">{selectedAction.title}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Operation Type</span>
                <span className="detail-val">{capitalize(selectedAction.actionType)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority</span>
                <span className={`badge ${selectedAction.priority}`}>{capitalize(selectedAction.priority)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`badge ${selectedAction.status}`}>{capitalize(selectedAction.status)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assigned Unit</span>
                <span className="detail-val">{selectedAction.assignedTo || 'Unassigned'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Estimated Duration</span>
                <span className="detail-val">{selectedAction.estimatedDurationMinutes ? `${selectedAction.estimatedDurationMinutes} minutes` : 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Incident ID</span>
                <span className="detail-val" style={{ fontFamily: 'var(--font-mono)' }}>{selectedAction.incidentId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-val" style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>{selectedAction.description}</span>
              </div>

              {/* Status Controller */}
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  UPDATE OPERATIONAL PROGRESS
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUSES.map(st => (
                    <button
                      key={st}
                      className={`btn btn-sm ${selectedAction.status === st ? 'btn-primary' : 'btn-ghost'}`}
                      disabled={actionLoading || selectedAction.status === st}
                      onClick={() => handleUpdateStatus(st)}
                    >
                      {capitalize(st)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAction(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Action Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateAction}>
              <div className="modal-header">
                <div className="modal-title">
                  <Zap size={20} color="var(--accent)" />
                  <span>Deploy Field Response Operation</span>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Operation Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Deploy Rapid Flood Barriers & Evacuation Pumps"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Action Type</label>
                    <select
                      className="form-select"
                      value={formData.actionType}
                      onChange={e => setFormData({ ...formData, actionType: e.target.value })}
                    >
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{capitalize(p)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Assigned Tactical Unit</label>
                    <input
                      className="form-input"
                      value={formData.assignedTo}
                      onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Duration (mins)</label>
                    <input
                      type="number"
                      step="15"
                      className="form-input"
                      value={formData.estimatedDurationMinutes}
                      onChange={e => setFormData({ ...formData, estimatedDurationMinutes: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Operational Briefing</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Describe equipment needed, objectives, and perimeter instructions..."
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
                  {actionLoading ? 'Deploying…' : 'Dispatch Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
