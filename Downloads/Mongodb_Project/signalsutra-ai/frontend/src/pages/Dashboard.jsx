import { useFetch } from '../hooks/useFetch'
import { api } from '../api/client'
import { timeAgo, capitalize } from '../utils/format'
import {
  Radio, AlertTriangle, Building2, Zap,
  ShieldAlert, TrendingUp, BarChart3, Activity,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

const SEVERITY_COLORS = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#f43f5e', '#64748b']

export default function Dashboard() {
  const { data, loading, error } = useFetch(() => api.dashboard(), [])

  if (loading) return <div className="loading-container"><div className="spinner" /><span>Loading command center…</span></div>
  if (error) return <div className="empty-state"><AlertTriangle size={48} /><p>Failed to load dashboard: {error}</p><p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Make sure the backend is running and MongoDB is connected. Use the "Seed Data" button to populate demo data.</p></div>

  const d = data

  return (
    <>
      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard icon={<Radio />} color="indigo" value={d.totalSignals} label="Total Signals" />
        <KpiCard icon={<AlertTriangle />} color="amber" value={d.activeIncidents} label="Active Incidents" />
        <KpiCard icon={<ShieldAlert />} color="red" value={d.criticalAlerts} label="Critical Alerts" />
        <KpiCard icon={<Building2 />} color="green" value={d.operationalAssets} label="Operational Assets" />
        <KpiCard icon={<Zap />} color="blue" value={d.pendingActions} label="Pending Actions" />
        <KpiCard
          icon={<TrendingUp />}
          color="indigo"
          value={d.avgRiskScore != null ? d.avgRiskScore.toFixed(1) : '—'}
          label="Avg Risk Score"
        />
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="charts-grid">
        {/* Signal Timeline */}
        <div className="chart-card" id="chart-timeline">
          <div className="chart-title"><Activity size={16} /> Signal Timeline (30d)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.signalTimeline}>
              <defs>
                <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#gradArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="chart-card" id="chart-severity">
          <div className="chart-title"><BarChart3 size={16} /> Severity Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.signalsBySeverity} barSize={32}>
              <XAxis dataKey="severity" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={capitalize} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(d.signalsBySeverity || []).map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.severity] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Types Pie */}
        <div className="chart-card" id="chart-types">
          <div className="chart-title"><Radio size={16} /> Signal Types</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={d.signalsByType}
                dataKey="count"
                nameKey="type"
                cx="50%" cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                strokeWidth={0}
              >
                {(d.signalsByType || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 12 }}
                formatter={(val, name) => [val, capitalize(name)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity Feed */}
        <div className="chart-card" id="activity-feed">
          <div className="chart-title"><Activity size={16} /> Recent Signals</div>
          <div className="activity-list" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {(d.recentSignals || []).map((s, i) => (
              <div className="activity-item" key={i}>
                <div className={`activity-dot ${s.severity}`} />
                <div className="activity-content">
                  <div className="activity-title">
                    {capitalize(s.signalType)} — {s.source?.name || 'Unknown'}
                  </div>
                  <div className="activity-time">{timeAgo(s.observedAt)}</div>
                </div>
                <span className={`badge ${s.severity}`}>{s.severity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function KpiCard({ icon, color, value, label }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${color}`}>{icon}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
