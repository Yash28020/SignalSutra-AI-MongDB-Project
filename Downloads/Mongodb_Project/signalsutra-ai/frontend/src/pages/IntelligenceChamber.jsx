import { useState, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { capitalize, formatDate } from '../utils/format'
import { celestialAudio } from '../components/universe/CelestialAudio'
import {
  GitFork,
  Radio,
  AlertTriangle,
  Building2,
  TrendingUp,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Scale,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

export default function IntelligenceChamber({ is3DMode }) {
  const [selectedIncidentId, setSelectedIncidentId] = useState(null)
  const [comparisonAssessmentId, setComparisonAssessmentId] = useState(null)
  const [isCompareMode, setIsCompareMode] = useState(false)

  // Fetch Incidents, Assessments, Signals, Assets
  const { data: incData, loading: incLoading } = useFetch(() => api.listIncidents({ limit: 50 }), [])
  const { data: assessData, loading: assessLoading } = useFetch(() => api.listAssessments({ limit: 50 }), [])
  const { data: sigData } = useFetch(() => api.listSignals({ limit: 100 }), [])
  const { data: assetData } = useFetch(() => api.listAssets({ limit: 50 }), [])

  const incidents = incData?.data || []
  const assessments = assessData?.data || []
  const signals = sigData?.data || []
  const assets = assetData?.data || []

  // Default select first incident
  const activeIncident = useMemo(() => {
    if (!incidents.length) return null
    if (!selectedIncidentId) return incidents[0]
    return incidents.find(i => i.id === selectedIncidentId) || incidents[0]
  }, [incidents, selectedIncidentId])

  // Get active assessment for selected incident
  const activeAssessment = useMemo(() => {
    if (!activeIncident || !assessments.length) return null
    return assessments.find(a => a.incidentId === activeIncident.id) || assessments[0]
  }, [activeIncident, assessments])

  // Comparison assessment
  const compareAssessment = useMemo(() => {
    if (!comparisonAssessmentId || !assessments.length) return assessments[1] || assessments[0]
    return assessments.find(a => a.id === comparisonAssessmentId) || assessments[1]
  }, [comparisonAssessmentId, assessments])

  // Correlated signals from real MongoDB linkedSignalIds
  const correlatedSignals = useMemo(() => {
    if (!activeIncident?.linkedSignalIds?.length) return []
    const linkedSet = new Set(activeIncident.linkedSignalIds)
    return signals.filter(s => linkedSet.has(s.id))
  }, [activeIncident, signals])

  // Comparison factors chart data
  const comparisonChartData = useMemo(() => {
    if (!activeAssessment?.factors) return []
    return activeAssessment.factors.map((f, i) => {
      const compFactor = compareAssessment?.factors?.[i]
      return {
        factor: f.factor.length > 14 ? f.factor.slice(0, 14) + '…' : f.factor,
        Primary: f.score,
        Comparison: compFactor ? compFactor.score : 5.0,
      }
    })
  }, [activeAssessment, compareAssessment])

  if (incLoading || assessLoading) {
    return (
      <div className="cosmic-loading-orb">
        <div className="nebula-spinner" />
        <span style={{ fontSize: '0.85rem', color: 'var(--electric-violet)' }}>
          SYNTHESIZING INTELLIGENCE CHAMBER EVIDENCE GRAPH…
        </span>
      </div>
    )
  }

  return (
    <div className="world-content-scrollable">
      {/* ── World Subheader & Model Audit Notice ───────────────────────── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={18} color="var(--electric-violet)" />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              Explainable Risk & Contributing Evidence Graph
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Deterministic Bayesian risk synthesis model v2.4 · Provenance audited
            </div>
          </div>
        </div>

        <button
          className={`btn-celestial ${isCompareMode ? 'btn-celestial-primary' : ''}`}
          onClick={() => {
            setIsCompareMode(!isCompareMode)
            celestialAudio.playPortalChime(1.1)
          }}
        >
          <Scale size={14} />
          <span>{isCompareMode ? 'Exit Comparison' : 'Compare Assessments'}</span>
        </button>
      </div>

      {/* ── Main 3-Column Intelligence Matrix ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: 20, minHeight: 600 }}>
        {/* Left Column: Incident Selector & Evidence Filters */}
        <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="hud-panel-title">
            <AlertTriangle size={15} /> Select Incident
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
            {incidents.map((inc) => {
              const isSelected = activeIncident?.id === inc.id
              return (
                <div
                  key={inc.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(167, 139, 250, 0.15)' : 'rgba(17, 26, 54, 0.45)',
                    border: isSelected ? '1px solid var(--electric-violet)' : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => {
                    celestialAudio.playNodeBeep(inc.severity)
                    setSelectedIncidentId(inc.id)
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? 'var(--electric-violet)' : 'var(--text-heading)' }}>
                    {inc.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span className={`badge-cosmic ${inc.severity}`} style={{ fontSize: '0.62rem' }}>{inc.severity}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {inc.linkedSignalIds?.length || 0} signals
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Center Column: Evidence Graph & Factor Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Real Relationship Evidence Graph Visualization */}
          <div className="hud-panel" style={{ flex: 1, minHeight: 340, position: 'relative' }}>
            <div className="hud-panel-title">
              <GitFork size={15} /> Correlated Evidence Graph ({activeIncident?.title})
            </div>

            <div style={{ position: 'relative', width: '100%', height: 260, background: 'rgba(7, 11, 25, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Central Incident Core Node */}
              <div
                style={{
                  position: 'absolute',
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255, 100, 124, 0.25), rgba(167, 139, 250, 0.25))',
                  border: '2px solid var(--critical-coral)',
                  boxShadow: '0 0 24px var(--coral-glow)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 6,
                  zIndex: 2,
                }}
              >
                <AlertTriangle size={18} color="var(--critical-coral)" />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
                  {activeIncident?.incidentType?.toUpperCase()}
                </span>
              </div>

              {/* Orbiting Correlated Signal Nodes */}
              {correlatedSignals.slice(0, 8).map((sig, idx) => {
                const total = Math.min(correlatedSignals.length, 8)
                const angle = (idx / total) * Math.PI * 2
                const dist = 120
                const x = Math.cos(angle) * dist
                const y = Math.sin(angle) * dist

                return (
                  <div
                    key={sig.id}
                    style={{
                      position: 'absolute',
                      transform: `translate(${x}px, ${y}px)`,
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'rgba(12, 19, 40, 0.9)',
                      border: '1px solid var(--celestial-cyan)',
                      boxShadow: '0 0 14px var(--cyan-glow)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 3,
                    }}
                    title={`${sig.signalType}: ${sig.observation?.value} ${sig.observation?.unit}`}
                    onClick={() => celestialAudio.playNodeBeep(sig.severity)}
                  >
                    <Radio size={14} color="var(--celestial-cyan)" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {sig.signalType.slice(0, 5)}
                    </span>
                  </div>
                )
              })}

              {/* Risk Assessment Node */}
              {activeAssessment && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 20,
                    padding: '8px 14px',
                    background: 'rgba(167, 139, 250, 0.15)',
                    border: '1px solid var(--electric-violet)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--electric-violet)',
                  }}
                >
                  <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Score: {activeAssessment.overallScore}/10 ({activeAssessment.riskLevel.toUpperCase()})
                </div>
              )}
            </div>
          </div>

          {/* Assessment Comparison Mode or Factor Breakdown */}
          {isCompareMode ? (
            <div className="hud-panel">
              <div className="hud-panel-title">
                <Scale size={15} /> Side-by-Side Risk Assessment Delta
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonChartData}>
                  <XAxis dataKey="factor" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background: '#0C1328', border: '1px solid var(--border-glass)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="Primary" fill="#54E7FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Comparison" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="hud-panel">
              <div className="hud-panel-title">
                <TrendingUp size={15} /> Evaluated Risk Factors & Weights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(activeAssessment?.factors || []).map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{f.factor}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--celestial-cyan)' }}>
                        {f.score} / 10 (Weight: {(f.weight * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(f.score / 10) * 100}%`,
                          height: '100%',
                          background: f.score > 7 ? 'var(--critical-coral)' : f.score > 4 ? 'var(--starlight-gold)' : 'var(--magical-teal)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contributing Evidence & Recommendations */}
        <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="hud-panel-title">
            <Sparkles size={15} /> Actionable Recommendations
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(activeAssessment?.recommendations || []).map((rec, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(12, 19, 40, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(84, 231, 255, 0.1)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  color: 'var(--text-primary)',
                }}
              >
                <CheckCircle2 size={14} color="var(--magical-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{rec}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: 12, background: 'rgba(17, 26, 54, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              MODEL PROVENANCE
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Assessed by: <strong style={{ color: 'var(--text-heading)' }}>{activeAssessment?.assessedBy || 'AI Engine'}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Timestamp: {formatDate(activeAssessment?.assessedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
