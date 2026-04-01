import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '💰' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Layout({ children, page, setPage }) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">📦</span>
          <span className="brand-name">StockFlow</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => { setPage(n.id); setSidebarOpen(false) }}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="topbar-title">{NAV.find(n => n.id === page)?.label}</div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
