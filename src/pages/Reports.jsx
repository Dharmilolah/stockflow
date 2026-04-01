import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function Reports() {
  const { user } = useAuth()
  const [monthOffset, setMonthOffset] = useState(0)
  const [data, setData] = useState({ sales: [], topProducts: [], summary: {} })
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)

  const currentMonth = subMonths(new Date(), monthOffset)

  useEffect(() => { load() }, [monthOffset])

  async function load() {
    setLoading(true)
    const start = startOfMonth(currentMonth).toISOString()
    const end = endOfMonth(currentMonth).toISOString()

    const { data: sales } = await supabase.from('sales').select('*').gte('sold_at', start).lte('sold_at', end).order('sold_at')

    const revenue = sales?.reduce((s, x) => s + Number(x.total_amount), 0) || 0
    const profit = sales?.reduce((s, x) => s + Number(x.profit), 0) || 0
    const cogs = sales?.reduce((s, x) => s + (Number(x.cost_price) * x.quantity_sold), 0) || 0
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0

    // Top products
    const byProduct = {}
    sales?.forEach(s => {
      if (!byProduct[s.product_name]) byProduct[s.product_name] = { name: s.product_name, qty: 0, revenue: 0, profit: 0 }
      byProduct[s.product_name].qty += s.quantity_sold
      byProduct[s.product_name].revenue += Number(s.total_amount)
      byProduct[s.product_name].profit += Number(s.profit)
    })
    const topProducts = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    setData({ sales: sales || [], topProducts, summary: { revenue, profit, cogs, margin, count: sales?.length || 0 } })

    // 6-month trend
    const trend = []
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(new Date(), i)
      const ms = startOfMonth(m).toISOString()
      const me = endOfMonth(m).toISOString()
      const { data: ms_sales } = await supabase.from('sales').select('total_amount,profit').gte('sold_at', ms).lte('sold_at', me)
      trend.push({
        month: format(m, 'MMM'),
        revenue: ms_sales?.reduce((s, x) => s + Number(x.total_amount), 0) || 0,
        profit: ms_sales?.reduce((s, x) => s + Number(x.profit), 0) || 0
      })
    }
    setTrendData(trend)
    setLoading(false)
  }

  const fmt = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="subtitle">{format(currentMonth, 'MMMM yyyy')}</p>
        </div>
        <div className="month-nav">
          <button onClick={() => setMonthOffset(o => o + 1)}>← Prev</button>
          <span>{format(currentMonth, 'MMM yyyy')}</span>
          <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0}>Next →</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading report...</div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card revenue">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{fmt(data.summary.revenue)}</div>
            </div>
            <div className="stat-card profit">
              <div className="stat-label">Total Profit</div>
              <div className="stat-value">{fmt(data.summary.profit)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cost of Goods</div>
              <div className="stat-value">{fmt(data.summary.cogs)}</div>
            </div>
            <div className="stat-card safe">
              <div className="stat-label">Profit Margin</div>
              <div className="stat-value">{data.summary.margin}%</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card chart-card">
              <h3>6-Month Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3>Top Products — {format(currentMonth, 'MMM yyyy')}</h3>
              {data.topProducts.length === 0 ? (
                <div className="empty-state">No sales this month</div>
              ) : (
                <div className="top-products">
                  {data.topProducts.map((p, i) => (
                    <div key={p.name} className="top-product-row">
                      <div className="top-rank">#{i + 1}</div>
                      <div className="top-info">
                        <div className="top-name">{p.name}</div>
                        <div className="top-meta">{p.qty} sold · Profit: {fmt(p.profit)}</div>
                      </div>
                      <div className="top-revenue">{fmt(p.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>All Sales — {format(currentMonth, 'MMMM yyyy')} ({data.sales.length} transactions)</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Product</th><th>Qty</th><th>Revenue</th><th>Profit</th><th>Customer</th></tr>
                </thead>
                <tbody>
                  {data.sales.length === 0 ? (
                    <tr><td colSpan={6} className="empty-row">No sales this month</td></tr>
                  ) : data.sales.map(s => (
                    <tr key={s.id}>
                      <td>{format(new Date(s.sold_at), 'dd MMM, HH:mm')}</td>
                      <td>{s.product_name}</td>
                      <td>{s.quantity_sold}</td>
                      <td>{fmt(s.total_amount)}</td>
                      <td><span className={`profit-badge ${Number(s.profit) >= 0 ? 'pos' : 'neg'}`}>{fmt(s.profit)}</span></td>
                      <td>{s.customer_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
