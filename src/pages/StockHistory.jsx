import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export default function StockHistory() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])

  useEffect(() => {
    supabase.from('stock_additions').select('*').order('added_at', { ascending: false })
      .then(({ data }) => setRecords(data || []))
  }, [user])

  const fmt = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Stock History</h2>
          <p className="subtitle">All stock purchases and additions</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Product</th><th>Qty Added</th><th>Cost Price</th><th>Total Cost</th><th>Supplier</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={7} className="empty-row">No stock additions yet.</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td>{format(new Date(r.added_at), 'dd MMM yyyy, HH:mm')}</td>
                <td><strong>{r.product_name}</strong></td>
                <td>{r.quantity_added}</td>
                <td>{fmt(r.cost_price)}</td>
                <td>{fmt(r.cost_price * r.quantity_added)}</td>
                <td>{r.supplier || '—'}</td>
                <td>{r.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
