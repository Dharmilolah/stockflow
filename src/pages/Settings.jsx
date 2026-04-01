import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: '', business_name: '', currency: 'NGN' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => { load() }, [user])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setForm({ full_name: data.full_name || '', business_name: data.business_name || '', currency: data.currency || 'NGN' })
  }

  async function saveProfile(e) {
    e.preventDefault(); setLoading(true); setMsg('')
    await supabase.from('profiles').upsert({ id: user.id, ...form })
    setMsg('Profile saved!'); setLoading(false)
  }

  async function changePassword(e) {
    e.preventDefault(); setPwMsg('')
    if (pwForm.password !== pwForm.confirm) { setPwMsg('Passwords do not match'); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.password })
    if (error) setPwMsg(error.message)
    else { setPwMsg('Password updated!'); setPwForm({ password: '', confirm: '' }) }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div className="page">
      <div className="page-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-grid">
        <div className="card">
          <h3>Business Profile</h3>
          <form onSubmit={saveProfile}>
            <div className="field">
              <label>Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handle} placeholder="Your name" />
            </div>
            <div className="field">
              <label>Business Name</label>
              <input name="business_name" value={form.business_name} onChange={handle} placeholder="Your business name" />
            </div>
            <div className="field">
              <label>Currency</label>
              <select name="currency" value={form.currency} onChange={handle}>
                <option value="NGN">NGN (₦) — Nigerian Naira</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="GHS">GHS (₵) — Ghana Cedi</option>
                <option value="KES">KES (KSh) — Kenyan Shilling</option>
                <option value="ZAR">ZAR (R) — South African Rand</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>
            {msg && <div className="msg success">{msg}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
          </form>
        </div>
        <div className="card">
          <h3>Account</h3>
          <div className="field">
            <label>Email</label>
            <input value={user?.email} disabled className="input-disabled" />
          </div>
          <h4 style={{margin:'1.25rem 0 0.75rem'}}>Change Password</h4>
          <form onSubmit={changePassword}>
            <div className="field">
              <label>New Password</label>
              <input type="password" value={pwForm.password} onChange={e => setPwForm({ ...pwForm, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="••••••••" />
            </div>
            {pwMsg && <div className={`msg ${pwMsg.includes('updated') ? 'success' : 'error'}`}>{pwMsg}</div>}
            <button type="submit" className="btn-outline">Update Password</button>
          </form>
          <div className="divider" />
          <button onClick={signOut} className="btn-danger-full">Sign Out</button>
        </div>
      </div>
    </div>
  )
}
