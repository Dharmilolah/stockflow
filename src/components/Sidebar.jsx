import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/sales', label: 'Sales', icon: '🛒' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ mobile, onClose }) {
  const { user } = useAuth()

  return (
    <aside className={`sidebar ${mobile ? 'mobile' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-icon">📦</span>
        <span className="brand-name">StockFlow</span>
        {mobile && <button className="close-btn" onClick={onClose}>✕</button>}
      </div>

      <nav className="sidebar-nav">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">{user?.email?.slice(0, 20)}{user?.email?.length > 20 ? '…' : ''}</div>
      </div>
    </aside>
  )
}
