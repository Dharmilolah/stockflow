import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', business_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: form.full_name } }
        })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: form.full_name, business_name: form.business_name })
        }
        setSuccess('Account created! You can now log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">📦</div>
          <h1>StockFlow</h1>
          <p>Inventory & Sales Management</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create Account</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <div className="field">
                <label>Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handle} placeholder="John Doe" required />
              </div>
              <div className="field">
                <label>Business Name</label>
                <input name="business_name" value={form.business_name} onChange={handle} placeholder="My Gadget Store" />
              </div>
            </>
          )}
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>

          {error && <div className="msg error">{error}</div>}
          {success && <div className="msg success">{success}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
