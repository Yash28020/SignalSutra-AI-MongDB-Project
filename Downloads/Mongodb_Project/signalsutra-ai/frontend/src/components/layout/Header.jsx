import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../../api/client'
import { Database, RefreshCw } from 'lucide-react'

export default function Header({ titles }) {
  const location = useLocation()
  const title = titles[location.pathname] || 'SignalSutra AI'
  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    if (!confirm('This will replace all data with demo records. Continue?')) return
    setSeeding(true)
    try {
      await api.seed()
      window.location.reload()
    } catch (e) {
      alert('Seed failed: ' + e.message)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <header className="top-header" id="top-header">
      <div className="header-left">
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="header-badge">
          <Database size={14} />
          <span>MongoDB</span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleSeed}
          disabled={seeding}
          id="seed-btn"
          title="Seed database with demo data"
        >
          <RefreshCw size={14} className={seeding ? 'spin' : ''} />
          {seeding ? 'Seeding…' : 'Seed Data'}
        </button>
      </div>
    </header>
  )
}
