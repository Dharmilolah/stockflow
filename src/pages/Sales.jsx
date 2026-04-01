import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

const EMPTY = { product_id: '', quantity_sold: 1, customer_name: '', notes: '', override_price: '' }

export default function Sales() {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [user])

  async function load() {
    const [salesRes, productsRes] = await Promise.all([
      supabase.from('sales').select('*').order('sold_at', { ascending: false }),
      supabase.from('products').select('*').eq('user_id', user.id).order('name')
    ])
    setSales(salesRes.data || [])
    setProducts(productsRes.data || [])
  }

  const handle = (e) => {
    const val = e.target.value
    const name = e.target.name
    if (name === 'product_id') {
      const p = products.find(p => p.id === val)
      setSelectedProduct(p || null)
      setForm({ ...form, product_id: val, override_price: '' })
    } else {
      setForm({ ...form, [name]: val })
    }
  }

  const effectivePrice = form.override_price ? Number(form.override_price) : (selectedProduct?.selling_price || 0)
  const total = effectivePrice * Number(form.quantity_sold || 0)
  const profit = selectedProduct ? (effectivePrice - selectedProduct.cost_price) * Number(form.quantity_sold || 0) : 0

  async function recordSale(e) {
    e.preventDefault()
    if (!selectedProduct) return
    if (selectedProduct.quantity < Number(form.quantity_sold)) {
      alert(`Not enough stock! Available: ${selectedProduct.quantity} ${selectedProduct.unit}`)
      return
    }
    setLoading(true)
    await supabase.from('sales').insert({
      user_id: user.id,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity_sold: Number(form.quantity_sold),
      selling_price: effectivePrice,
      cost_price: selectedProduct.cost_price,
      total_amount: total,
      profit,
      customer_name: form.customer_name,
      notes: form.notes
    })
    await supabase.from('products').update({ quantity: selectedProduct.quantity - Number(form.quantity_sold) }).eq('id', selectedProduct.id)
    setShowModal(false); setForm(EMPTY); setSelectedProduct(null); setLoading(false)
    load()
  }

  async function deleteSale(sale) {
    if (!confirm('Delete this sale? Stock will be restored.')) return
    await supabase.from('sales').delete().eq('id', sale.id)
    if (sale.product_id) {
      const { data: p } = await supabase.from('products').select('quantity').eq('id', sale.product_id).single()
      if (p) await supabase.from('products').update({ quantity: p.quantity + sale.quantity_sold }).eq('id', sale.product_id)
    }
    load()
  }

  const now = new Date()
  const filtered = sales.filter(s => {
    if (filter === 'all') return true
    const d = new Date(s.sold_at)
    if (filter === 'today') return d.toDateString() === now.toDateString()
    if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  })

  const totalRevenue = filtered.reduce((s, x) => s + Number(x.total_amount), 0)
  const totalProfit = filtered.reduce((s, x) => s + Number(x.profit), 0)

  const fmt = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Sales</h2>
          <p className="subtitle">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Record Sale</button>
      </div>

      <div className="toolbar">
        <div className="filter-tabs">
          {['all', 'today', 'month'].map(f => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : 'This Month'}
            </button>
          ))}
        </div>
        <div className="summary-pills">
          <span className="pill">Revenue: {fmt(totalRevenue)}</span>
          <span className="pill green">Profit: {fmt(totalProfit)}</span>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Profit</th>
              <th>Customer</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="empty-row">No sales yet. Record your first sale!</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td><div className="product-name">{s.product_name}</div></td>
                <td>{s.quantity_sold}</td>
                <td>{fmt(s.selling_price)}</td>
                <td><strong>{fmt(s.total_amount)}</strong></td>
                <td><span className={`profit-badge ${Number(s.profit) >= 0 ? 'pos' : 'neg'}`}>{fmt(s.profit)}</span></td>
                <td>{s.customer_name || '—'}</td>
                <td>{format(new Date(s.sold_at), 'dd MMM yy, HH:mm')}</td>
                <td><button className="btn-sm btn-danger" onClick={() => deleteSale(s)}>Del</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Record Sale</h3>
            <form onSubmit={recordSale}>
              <div className="field">
                <label>Product *</label>
                <select name="product_id" value={form.product_id} onChange={handle} required>
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="product-info-box">
                  <span>Cost: ₦{Number(selectedProduct.cost_price).toLocaleString()}</span>
                  <span>Selling: ₦{Number(selectedProduct.selling_price).toLocaleString()}</span>
                  <span>Available: {selectedProduct.quantity} {selectedProduct.unit}</span>
                </div>
              )}

              <div className="form-row">
                <div className="field">
                  <label>Quantity *</label>
                  <input name="quantity_sold" type="number" value={form.quantity_sold} onChange={handle} required min="1" />
                </div>
                <div className="field">
                  <label>Override Price (optional)</label>
                  <input name="override_price" type="number" value={form.override_price} onChange={handle} placeholder={selectedProduct?.selling_price || '0'} />
                </div>
              </div>

              <div className="field">
                <label>Customer Name</label>
                <input name="customer_name" value={form.customer_name} onChange={handle} placeholder="Optional" />
              </div>
              <div className="field">
                <label>Notes</label>
                <input name="notes" value={form.notes} onChange={handle} placeholder="Optional notes..." />
              </div>

              {selectedProduct && (
                <div className="sale-summary">
                  <div><span>Total Amount:</span><strong>{fmt(total)}</strong></div>
                  <div><span>Profit:</span><strong className={profit >= 0 ? 'green' : 'red'}>{fmt(profit)}</strong></div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Record Sale'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
