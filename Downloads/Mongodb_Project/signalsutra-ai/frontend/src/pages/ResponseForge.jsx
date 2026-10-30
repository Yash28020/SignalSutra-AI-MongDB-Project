import { useState, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { capitalize, formatDate } from '../utils/format'
import { celestialAudio } from '../components/universe/CelestialAudio'
import {
  Zap,
  Building2,
  AlertTriangle,
  PlayCircle,
  CheckCircle2,
  Clock,
  Plus,
  Sliders,
  ShieldAlert,
  Flame,
  X,
} from 'lucide-react'

const ACTION_TYPES = [
  'evacuate', 'deploy_team', 'distribute_supplies',
  'medical_response', 'infrastructure_repair',
  'communication', 'search_rescue', 'other',
]
const PRIORITIES = ['low', 'medium', 'high', 'critical']
const STATUSES = ['planned', 'in_progress', 'completed', 'cancelled']

export default function ResponseForge() {
  const [activeTab, setActiveTab] = useState('planner') // planner | inventory | simulator
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch actions, assets, incidents
  const { data: actData, loading: actLoading } = useFetch(() => api.listActions({ limit: 50 }), [refreshTrigger])
  const { data: assetData } = useFetch(() => api.listAssets({ limit: 50 }), [refreshTrigger])
  const { data: incData } = useFetch(() => api.listIncidents({ limit: 50 }), [])

  const actions = actData?.data || []
  const assets = assetData?.data || []
  const incidents = incData?.data || []

  // What-If Scenario Simulator Parameters
  const [simParams, setSimParams] = useState({
    rainfallMultiplier: 1.3, // +30%
    roadDisruptions: 4,      // 4 simulated closures
    shelterCapacityLoss: 20, // -20%
  })

  // Simulated outcomes calculation (deterministic)
  const simOutcomes = useMemo(() => {
    const baseRisk = 5.2
    const additionalStrain = (simParams.rainfallMultiplier - 1.0) * 4.5 + (simParams.roadDisruptions * 0.4) + (simParams.shelterCapacityLoss * 0.05)
    const simulatedRisk = Math.min(10.0, Math.max(1.0, baseRisk + additionalStrain))
    const requiredTeams = Math.ceil(simulatedRisk * 1.8)
    const availableAssets = assets.filter(a => a.availabilityStatus === 'operational').length
    const resourceDeficit = Math.max(0, requiredTeams - availableAssets)

    return {
      simulatedRisk: simulatedRisk.toFixed(1),
      requiredTeams,
      resourceDeficit,
      status: simulatedRisk > 7.5 ? 'CRITICAL DEFICIT' : simulatedRisk > 5.5 ? 'ELEVATED STRAIN' : 'MANAGEABLE',
    }
  }, [simParams, assets])

  // New Action Form State
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
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

  const handleDeployAction = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    celestialAudio.playPortalChime(1.3)
    try {
      let incId = formData.incidentId || incidents[0]?.id || 'GENERAL-INCIDENT'
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
      setShowDeployModal(false)
      setRefreshTrigger(prev => prev + 1)
      window.dispatchEvent(new CustomEvent('signalsutra:refresh'))
    } catch (err) {
      alert(`Action dispatch failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (actionId, newStatus) => {
    celestialAudio.playPortalChime(1.1)
    try {
      await api.updateAction(actionId, { status: newStatus })
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      alert(`Update failed: ${err.message}`)
    }
  }

  return (
    <div className="world-content-scrollable">
      {/* ── Subheader with Module Tabs ─────────────────────────────────── */}
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
          <Zap size={18} color="var(--critical-coral)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Tactical Operations Command & What-If Forge
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn-celestial ${activeTab === 'planner' ? 'btn-celestial-primary' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            Response Planner ({actions.length})
          </button>
          <button
            className={`btn-celestial ${activeTab === 'inventory' ? 'btn-celestial-primary' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Asset Readiness ({assets.length})
          </button>
          <button
            className={`btn-celestial ${activeTab === 'simulator' ? 'btn-celestial-primary' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            What-If Simulator
          </button>
        </div>
      </div>

      {/* ── Tab 1: Tactical Response Planner ───────────────────────────── */}
      {activeTab === 'planner' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              className="btn-celestial btn-celestial-primary"
              onClick={() => {
                celestialAudio.playPortalChime(1.1)
                setShowDeployModal(true)
              }}
            >
              <Plus size={14} /> Deploy Tactical Operation
            </button>
          </div>

          <div className="cosmic-table-container">
            <table className="cosmic-table">
              <thead>
                <tr>
                  <th>Operation Title</th>
                  <th>Action Category</th>
                  <th>Priority</th>
                  <th>Assigned Unit</th>
                  <th>Duration</th>
                  <th>Workflow Progression</th>
                </tr>
              </thead>
              <tbody>
                {actions.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-heading)', maxWidth: 280 }}>
                      {a.title}
                    </td>
                    <td>{capitalize(a.actionType)}</td>
                    <td><span className={`badge-cosmic ${a.priority}`}>{a.priority}</span></td>
                    <td style={{ color: 'var(--celestial-cyan)', fontWeight: 600 }}>{a.assignedTo || 'Unassigned'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{a.estimatedDurationMinutes}m</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {STATUSES.map(st => (
                          <button
                            key={st}
                            className={`badge-cosmic ${a.status === st ? st : 'rejected'}`}
                            style={{
                              cursor: 'pointer',
                              border: a.status === st ? '1px solid currentColor' : 'none',
                              opacity: a.status === st ? 1 : 0.45,
                            }}
                            onClick={() => handleUpdateStatus(a.id, st)}
                          >
                            {capitalize(st)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Resource Inventory & Shelter Monitoring ─────────────── */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {assets.map(asset => (
            <div key={asset.id} className="hud-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className={`badge-cosmic ${asset.availabilityStatus}`}>{asset.availabilityStatus}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{capitalize(asset.assetType)}</span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>
                {asset.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Capacity: <strong style={{ color: 'var(--celestial-cyan)', fontFamily: 'var(--font-mono)' }}>{asset.capacity || 'N/A'} beds/slots</strong></div>
                <div>Hotline: <strong style={{ color: 'var(--text-primary)' }}>{asset.contactInfo || 'Not specified'}</strong></div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  Coords: [{asset.location?.coordinates?.[0]?.toFixed(3)}, {asset.location?.coordinates?.[1]?.toFixed(3)}]
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 3: What-If Scenario Simulator ──────────────────────────── */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          <div className="hud-panel">
            <div className="hud-panel-title">
              <Sliders size={16} /> What-If Dynamic Parameter Injection
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Adjust meteorological and infrastructural strain variables to recalculate deterministic resource requirements.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span>Simulated Rainfall Surge Intensity</span>
                  <strong style={{ color: 'var(--celestial-cyan)', fontFamily: 'var(--font-mono)' }}>
                    +{Math.round((simParams.rainfallMultiplier - 1.0) * 100)}%
                  </strong>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={simParams.rainfallMultiplier}
                  onChange={e => setSimParams({ ...simParams, rainfallMultiplier: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--celestial-cyan)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span>Major Arterial Road Closures</span>
                  <strong style={{ color: 'var(--starlight-gold)', fontFamily: 'var(--font-mono)' }}>
                    {simParams.roadDisruptions} blocked corridors
                  </strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={simParams.roadDisruptions}
                  onChange={e => setSimParams({ ...simParams, roadDisruptions: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', accentColor: 'var(--starlight-gold)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span>Emergency Shelter Capacity Loss</span>
                  <strong style={{ color: 'var(--critical-coral)', fontFamily: 'var(--font-mono)' }}>
                    -{simParams.shelterCapacityLoss}%
                  </strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={simParams.shelterCapacityLoss}
                  onChange={e => setSimParams({ ...simParams, shelterCapacityLoss: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', accentColor: 'var(--critical-coral)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="hud-panel-title">
              <ShieldAlert size={16} /> Projected Impact Outcomes
            </div>

            <div style={{ padding: 16, background: 'rgba(12, 19, 40, 0.7)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Simulated Composite Risk
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--critical-coral)', fontFamily: 'var(--font-mono)' }}>
                {simOutcomes.simulatedRisk} / 10
              </div>
              <div className="badge-cosmic critical" style={{ marginTop: 4 }}>
                {simOutcomes.status}
              </div>
            </div>

            <div className="detail-row">
              <span className="detail-label">Required Response Units</span>
              <span className="detail-val" style={{ color: 'var(--celestial-cyan)' }}>{simOutcomes.requiredTeams} Teams</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Resource Gap / Deficit</span>
              <span className="detail-val" style={{ color: 'var(--critical-coral)' }}>{simOutcomes.resourceDeficit} Units Short</span>
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
              * What-If Simulator uses deterministic scenario formulas for civil defense tabletop planning. Real emergency operations remain with authorized NDRF/Civil commanders.
            </div>
          </div>
        </div>
      )}

      {/* ── Deploy Action Modal ────────────────────────────────────────── */}
      {showDeployModal && (
        <div className="cosmic-modal-overlay" onClick={() => setShowDeployModal(false)}>
          <div className="cosmic-modal-card" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleDeployAction}>
              <div className="cosmic-modal-header">
                <div className="cosmic-modal-title">
                  <Zap size={18} color="var(--critical-coral)" />
                  <span>Deploy Tactical Response Operation</span>
                </div>
                <button type="button" className="btn-celestial" onClick={() => setShowDeployModal(false)}>
                  <X size={14} />
                </button>
              </div>

              <div className="cosmic-modal-body">
                <div className="form-group">
                  <label className="form-label">Operation Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Deploy Rapid Flood Barriers & Evacuation Boat Unit"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Operation Type</label>
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
                    <label className="form-label">Assigned Unit</label>
                    <input
                      className="form-input"
                      value={formData.assignedTo}
                      onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
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
                  <label className="form-label">Tactical Briefing</label>
                  <input
                    className="form-input"
                    placeholder="Perimeter details, staging grounds..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="cosmic-modal-footer">
                <button type="button" className="btn-celestial" onClick={() => setShowDeployModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-celestial btn-celestial-primary" disabled={actionLoading}>
                  {actionLoading ? 'Deploying…' : 'Dispatch Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
