import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ revenue: 0, profit: 0, sales: 0, lowStock: 0 })
  const [chartData, setChartData] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [user])

  async function loadDashboard() {
    const now = new Date()
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd = endOfMonth(now).toISOString()

    const [profileRes, salesRes, allSalesRes, productsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('sales').select('*').gte('sold_at', monthStart).lte('sold_at', monthEnd),
      supabase.from('sales').select('*').order('sold_at', { ascending: false }).limit(5),
      supabase.from('products').select('*').eq('user_id', user.id)
    ])

    setProfile(profileRes.data)
    const sales = salesRes.data || []
    const products = productsRes.data || []

    const revenue = sales.reduce((s, x) => s + Number(x.total_amount), 0)
    const profit = sales.reduce((s, x) => s + Number(x.profit), 0)
    const lowStock = products.filter(p => p.quantity <= p.low_stock_alert).length

    setStats({ revenue, profit, sales: sales.length, lowStock })
    setRecentSales(allSalesRes.data || [])

    // Build last 7 days chart
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const label = format(d, 'EEE')
      const dayStart = new Date(d.setHours(0,0,0,0)).toISOString()
      const dayEnd = new Date(d.setHours(23,59,59,999)).toISOString()
      const daySales = sales.filter(s => s.sold_at >= dayStart && s.sold_at <= dayEnd)
      days.push({ day: label, revenue: daySales.reduce((s, x) => s + Number(x.total_amount), 0), profit: daySales.reduce((s, x) => s + Number(x.profit), 0) })
    }
    setChartData(days)
    setLoading(false)
  }

  const currency = profile?.currency || 'NGN'
  const fmt = (n) => `${currency} ${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  if (loading) return <div className="loading">Loading dashboard...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="subtitle">{format(new Date(), 'MMMM yyyy')} Overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">{fmt(stats.revenue)}</div>
        </div>
        <div className="stat-card profit">
          <div className="stat-label">Monthly Profit</div>
          <div className="stat-value">{fmt(stats.profit)}</div>
        </div>
        <div className="stat-card sales">
          <div className="stat-label">Sales This Month</div>
          <div className="stat-value">{stats.sales}</div>
        </div>
        <div className={`stat-card ${stats.lowStock > 0 ? 'alert' : 'safe'}`}>
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">{stats.lowStock}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card chart-card">
          <h3>Revenue & Profit (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4,4,0,0]} name="Revenue" />
              <Bar dataKey="profit" fill="#10b981" radius={[4,4,0,0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Recent Sales</h3>
          {recentSales.length === 0 ? (
            <div className="empty-state">No sales yet. Record your first sale!</div>
          ) : (
            <div className="recent-list">
              {recentSales.map(s => (
                <div key={s.id} className="recent-item">
                  <div>
                    <div className="recent-name">{s.product_name}</div>
                    <div className="recent-meta">{s.quantity_sold} unit(s) · {format(new Date(s.sold_at), 'dd MMM, HH:mm')}</div>
                  </div>
                  <div className="recent-amount">{fmt(s.total_amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
