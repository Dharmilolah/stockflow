import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import Layout from './components/Layout'
import './App.css'

function AppInner() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('dashboard')

  // Load Paystack script once
  useEffect(() => {
    if (document.getElementById('paystack-script')) return
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  if (loading) return (
    <div className="splash">
      <div className="splash-icon">📦</div>
      <div className="splash-name">StockFlow</div>
      <div className="splash-loader" />
    </div>
  )

  if (!user) return <AuthPage />

  const pages = {
    dashboard: Dashboard,
    products: Products,
    sales: Sales,
    reports: Reports,
    settings: Settings,
    pricing: Pricing,
  }
  const Page = pages[page] || Dashboard

  return (
    <Layout page={page} setPage={setPage}>
      <Page onClose={page === 'pricing' ? () => setPage('dashboard') : undefined} setPage={setPage} />
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
