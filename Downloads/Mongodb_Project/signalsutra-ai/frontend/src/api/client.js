/**
 * SignalSutra AI — Centralized API Client
 * Manages async communication with FastAPI and MongoDB backend.
 */

const BASE = '/api'

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 12000)

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    })
    clearTimeout(timeoutId)

    if (res.status === 204) return null
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Request failed with status ${res.status}`)
    }
    return res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check backend connection.')
    }
    throw err
  }
}

export const api = {
  // ── System & Health ───────────────────────────────────────────────────
  health: () => request('/health'),
  seed: () => request('/seed', { method: 'POST' }),

  // ── Dashboard Metrics ─────────────────────────────────────────────────
  dashboard: () => request('/dashboard'),

  // ── Signals ───────────────────────────────────────────────────────────
  listSignals: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/signals${q ? '?' + q : ''}`)
  },
  getSignal: (id) => request(`/signals/${id}`),
  createSignal: (data) => request('/signals', { method: 'POST', body: JSON.stringify(data) }),
  updateSignal: (id, data) => request(`/signals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSignal: (id) => request(`/signals/${id}`, { method: 'DELETE' }),
  nearbySignals: (longitude, latitude, radiusKm = 50, limit = 20) => {
    const q = new URLSearchParams({ longitude, latitude, radiusKm, limit }).toString()
    return request(`/signals/nearby?${q}`)
  },

  // ── Incidents ─────────────────────────────────────────────────────────
  listIncidents: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/incidents${q ? '?' + q : ''}`)
  },
  getIncident: (id) => request(`/incidents/${id}`),
  createIncident: (data) => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateIncident: (id, data) => request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIncident: (id) => request(`/incidents/${id}`, { method: 'DELETE' }),

  // ── Infrastructure Assets ─────────────────────────────────────────────
  listAssets: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/assets${q ? '?' + q : ''}`)
  },
  getAsset: (id) => request(`/assets/${id}`),
  createAsset: (data) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
  updateAsset: (id, data) => request(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAsset: (id) => request(`/assets/${id}`, { method: 'DELETE' }),
  nearbyAssets: (longitude, latitude, radiusKm = 50, limit = 20) => {
    const q = new URLSearchParams({ longitude, latitude, radiusKm, limit }).toString()
    return request(`/assets/nearby?${q}`)
  },

  // ── Response Actions ──────────────────────────────────────────────────
  listActions: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/actions${q ? '?' + q : ''}`)
  },
  getAction: (id) => request(`/actions/${id}`),
  createAction: (data) => request('/actions', { method: 'POST', body: JSON.stringify(data) }),
  updateAction: (id, data) => request(`/actions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAction: (id) => request(`/actions/${id}`, { method: 'DELETE' }),

  // ── Risk Assessments ──────────────────────────────────────────────────
  listAssessments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/assessments${q ? '?' + q : ''}`)
  },
  getAssessment: (id) => request(`/assessments/${id}`),
  createAssessment: (data) => request('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  deleteAssessment: (id) => request(`/assessments/${id}`, { method: 'DELETE' }),
}
