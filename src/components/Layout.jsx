import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '💰' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'pricing', label: 'Plans & Billing', icon: '⭐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const PLAN_COLORS = { free: '#6b7280', basic: '#4f46e5', pro: '#f59e0b' }
const PLAN_LABELS = { free: 'Free', basic: 'Basic', pro: 'Pro' }

export default function Layout({ children, page, setPage }) {
  const { user } = useAuth()
  const { plan } = useSubscription()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="layout">
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
              className={`nav-item ${page === n.id ? 'active' : ''} ${n.id === 'pricing' ? 'nav-upgrade' : ''}`}
              onClick={() => { setPage(n.id); setSidebarOpen(false) }}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {plan !== 'pro' && (
            <button className="upgrade-pill" onClick={() => setPage('pricing')}>
              🚀 Upgrade Plan
            </button>
          )}
          <div className="user-chip">
            <div className="user-avatar" style={{ background: PLAN_COLORS[plan] || '#4f46e5' }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="user-email">{user?.email}</div>
              <div className="user-plan" style={{ color: PLAN_COLORS[plan] }}>
                {PLAN_LABELS[plan] || 'Free'} Plan
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="topbar-title">{NAV.find(n => n.id === page)?.label}</div>
          <div className="topbar-right">
            <span className="plan-badge" style={{ background: PLAN_COLORS[plan] + '22', color: PLAN_COLORS[plan], border: `1px solid ${PLAN_COLORS[plan]}44` }}>
              {PLAN_LABELS[plan]} Plan
            </span>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
