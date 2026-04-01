import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import StockHistory from './pages/StockHistory'
import Settings from './pages/Settings'
import { supabase } from './lib/supabase'
import './App.css'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '💰' },
  { id: 'stock-history', label: 'Stock History', icon: '📋' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

function AppInner() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) return (
    <div className="splash">
      <div className="splash-icon">📦</div>
      <div className="splash-name">StockFlow</div>
      <div className="splash-loader" />
    </div>
  )

  if (!user) return <AuthPage />

  const pages = {
    'dashboard': <Dashboard />,
    'products': <Products />,
    'sales': <Sales />,
    'stock-history': <StockHistory />,
    'reports': <Reports />,
    'settings': <Settings />,
  }

  const current = NAV.find(n => n.id === page)

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span>📦</span>
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
          <div className="user-info">
            <div className="user-avatar">{user.email[0].toUpperCase()}</div>
            <div className="user-email" title={user.email}>{user.email}</div>
          </div>
          <button className="logout-btn" onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)}>☰</button>
          <div className="topbar-title">{current?.icon} {current?.label}</div>
          <div className="user-badge">{user.email[0].toUpperCase()}</div>
        </header>
        <main className="content-area">
          {pages[page]}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
