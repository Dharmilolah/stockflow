import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const EMPTY = { name: '', category: '', cost_price: '', selling_price: '', quantity: '', low_stock_alert: 5, unit: 'pcs', description: '' }

export default function Products() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showAddStock, setShowAddStock] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [stockForm, setStockForm] = useState({ quantity_added: '', supplier: '', notes: '' })
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [user])

  async function load() {
    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).order('name')
    setProducts(data || [])
  }

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleStock = (e) => setStockForm({ ...stockForm, [e.target.name]: e.target.value })

  async function saveProduct(e) {
    e.preventDefault(); setLoading(true)
    const payload = { ...form, user_id: user.id, cost_price: Number(form.cost_price), selling_price: Number(form.selling_price), quantity: Number(form.quantity), low_stock_alert: Number(form.low_stock_alert) }
    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing)
    } else {
      const { data } = await supabase.from('products').insert(payload).select().single()
      if (data && Number(form.quantity) > 0) {
        await supabase.from('stock_additions').insert({ user_id: user.id, product_id: data.id, product_name: form.name, quantity_added: Number(form.quantity), cost_price: Number(form.cost_price), notes: 'Initial stock' })
      }
    }
    setShowModal(false); setForm(EMPTY); setEditing(null); setLoading(false)
    load()
  }

  async function addStock(e) {
    e.preventDefault(); setLoading(true)
    const p = showAddStock
    await supabase.from('stock_additions').insert({ user_id: user.id, product_id: p.id, product_name: p.name, quantity_added: Number(stockForm.quantity_added), cost_price: p.cost_price, supplier: stockForm.supplier, notes: stockForm.notes })
    await supabase.from('products').update({ quantity: p.quantity + Number(stockForm.quantity_added) }).eq('id', p.id)
    setShowAddStock(null); setStockForm({ quantity_added: '', supplier: '', notes: '' }); setLoading(false)
    load()
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  function openEdit(p) {
    setEditing(p.id)
    setForm({ name: p.name, category: p.category || '', cost_price: p.cost_price, selling_price: p.selling_price, quantity: p.quantity, low_stock_alert: p.low_stock_alert, unit: p.unit, description: p.description || '' })
    setShowModal(true)
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase()))
  const margin = (p) => p.cost_price > 0 ? (((p.selling_price - p.cost_price) / p.cost_price) * 100).toFixed(1) : 0

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Products & Inventory</h2>
          <p className="subtitle">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm(EMPTY); setShowModal(true) }}>+ Add Product</button>
      </div>

      <div className="toolbar">
        <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Margin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="empty-row">No products found. Add your first product!</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className={p.quantity <= p.low_stock_alert ? 'low-stock-row' : ''}>
                <td>
                  <div className="product-name">{p.name}</div>
                  {p.description && <div className="product-desc">{p.description}</div>}
                </td>
                <td><span className="badge">{p.category || '—'}</span></td>
                <td>
                  <span className={`qty ${p.quantity <= p.low_stock_alert ? 'qty-low' : 'qty-ok'}`}>
                    {p.quantity} {p.unit}
                  </span>
                  {p.quantity <= p.low_stock_alert && <span className="low-badge">Low</span>}
                </td>
                <td>₦{Number(p.cost_price).toLocaleString()}</td>
                <td>₦{Number(p.selling_price).toLocaleString()}</td>
                <td><span className="margin-badge">{margin(p)}%</span></td>
                <td>
                  <div className="action-btns">
                    <button className="btn-sm" onClick={() => setShowAddStock(p)}>+ Stock</button>
                    <button className="btn-sm btn-outline" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn-sm btn-danger" onClick={() => deleteProduct(p.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={saveProduct}>
              <div className="form-row">
                <div className="field">
                  <label>Product Name *</label>
                  <input name="name" value={form.name} onChange={handle} required placeholder="e.g. iPhone 15 Pro" />
                </div>
                <div className="field">
                  <label>Category</label>
                  <input name="category" value={form.category} onChange={handle} placeholder="e.g. Phones" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Cost Price (₦) *</label>
                  <input name="cost_price" type="number" value={form.cost_price} onChange={handle} required placeholder="0" />
                </div>
                <div className="field">
                  <label>Selling Price (₦) *</label>
                  <input name="selling_price" type="number" value={form.selling_price} onChange={handle} required placeholder="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>{editing ? 'Current Quantity' : 'Initial Quantity'} *</label>
                  <input name="quantity" type="number" value={form.quantity} onChange={handle} required placeholder="0" />
                </div>
                <div className="field">
                  <label>Unit</label>
                  <input name="unit" value={form.unit} onChange={handle} placeholder="pcs" />
                </div>
              </div>
              <div className="field">
                <label>Low Stock Alert (when qty falls below)</label>
                <input name="low_stock_alert" type="number" value={form.low_stock_alert} onChange={handle} />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handle} placeholder="Optional notes..." rows={2} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="modal-overlay" onClick={() => setShowAddStock(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Stock — {showAddStock.name}</h3>
            <p className="subtitle">Current stock: {showAddStock.quantity} {showAddStock.unit}</p>
            <form onSubmit={addStock}>
              <div className="field">
                <label>Quantity to Add *</label>
                <input name="quantity_added" type="number" value={stockForm.quantity_added} onChange={handleStock} required placeholder="0" min="1" />
              </div>
              <div className="field">
                <label>Supplier</label>
                <input name="supplier" value={stockForm.supplier} onChange={handleStock} placeholder="Supplier name (optional)" />
              </div>
              <div className="field">
                <label>Notes</label>
                <input name="notes" value={stockForm.notes} onChange={handleStock} placeholder="Any notes..." />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddStock(null)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Add Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
