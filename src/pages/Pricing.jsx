import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSubscription, PLANS } from '../hooks/useSubscription'

// ⚠️ Replace with your actual Paystack PUBLIC key from dashboard.paystack.com
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

const PLAN_DETAILS = [
  {
    id: 'free', emoji: '🌱', color: '#6b7280',
    features: ['Up to 10 products','Up to 50 sales/month','Basic dashboard','No monthly reports','No invoice generation','No priority support'],
    disabled: [false,false,false,true,true,true],
  },
  {
    id: 'basic', emoji: '🚀', color: '#4f46e5', popular: true,
    features: ['Up to 100 products','Up to 500 sales/month','Full dashboard & charts','Monthly reports & analytics','No invoice generation','Email support'],
    disabled: [false,false,false,false,true,false],
  },
  {
    id: 'pro', emoji: '💎', color: '#f59e0b',
    features: ['Unlimited products','Unlimited sales','Full dashboard & charts','Monthly reports & analytics','PDF Invoice generation','Priority support'],
    disabled: [false,false,false,false,false,false],
  },
]

export default function Pricing({ onClose }) {
  const { user } = useAuth()
  const { plan: currentPlan, refresh } = useSubscription()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  function initializePaystack(planId) {
    const planInfo = PLANS[planId]
    if (!planInfo || planInfo.price === 0) return
    setLoading(planId); setError('')
    const reference = `sf_${planId}_${Date.now()}`
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: planInfo.price * 100,
      currency: 'NGN',
      ref: reference,
      metadata: { user_id: user.id, plan_id: planId },
      callback: async (response) => { await handlePaymentSuccess(response, planId, planInfo) },
      onClose: () => { setLoading(null) },
    })
    handler.openIframe()
  }

  async function handlePaymentSuccess(response, planId, planInfo) {
    try {
      const now = new Date()
      const periodEnd = new Date(now); periodEnd.setMonth(periodEnd.getMonth() + 1)
      await supabase.from('payments').insert({ user_id: user.id, plan: planId, amount: planInfo.price * 100, paystack_reference: response.reference, status: 'success', paid_at: now.toISOString() })
      await supabase.from('subscriptions').upsert({ user_id: user.id, plan: planId, status: 'active', paystack_reference: response.reference, amount_paid: planInfo.price * 100, current_period_start: now.toISOString(), current_period_end: periodEnd.toISOString(), updated_at: now.toISOString() }, { onConflict: 'user_id' })
      await refresh(); setLoading(null)
      if (onClose) onClose()
    } catch (err) {
      setError('Payment received but plan update failed. Contact support with ref: ' + response.reference)
      setLoading(null)
    }
  }

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h2>Choose Your Plan</h2>
        <p>Start free, upgrade when you grow</p>
        {onClose && <button className="pricing-close" onClick={onClose}>✕</button>}
      </div>
      {error && <div className="msg error" style={{maxWidth:700,margin:'0 auto 1.5rem'}}>{error}</div>}
      <div className="pricing-grid">
        {PLAN_DETAILS.map((detail) => {
          const plan = PLANS[detail.id]
          const isCurrent = currentPlan === detail.id
          const isLoading = loading === detail.id
          return (
            <div key={detail.id} className={`pricing-card ${detail.popular?'popular':''} ${isCurrent?'current':''}`}>
              {detail.popular && <div className="popular-badge">⭐ Most Popular</div>}
              {isCurrent && !detail.popular && <div className="current-badge">Current Plan</div>}
              <div className="plan-icon">{detail.emoji}</div>
              <div className="plan-name" style={{color: detail.color}}>{plan.name}</div>
              <div className="plan-price">
                {plan.price === 0
                  ? <span className="price-free">Free forever</span>
                  : <><span className="price-amount">₦{plan.price.toLocaleString()}</span><span className="price-period">/month</span></>
                }
              </div>
              <ul className="plan-features">
                {detail.features.map((f,i) => (
                  <li key={i} className={detail.disabled[i] ? 'feat-off' : 'feat-on'}>
                    <span className="feat-icon">{detail.disabled[i] ? '✗' : '✓'}</span>{f}
                  </li>
                ))}
              </ul>
              <button
                className={`plan-btn ${isCurrent?'plan-btn-current':'plan-btn-upgrade'}`}
                style={!isCurrent ? {background: detail.color} : {}}
                disabled={isCurrent || isLoading || detail.id === 'free'}
                onClick={() => initializePaystack(detail.id)}
              >
                {isLoading ? '⏳ Opening...' : isCurrent ? '✓ Active Plan' : detail.id === 'free' ? '✓ Free Plan' : `Upgrade to ${plan.name} →`}
              </button>
            </div>
          )
        })}
      </div>
      <p className="pricing-note">🔒 Payments secured by Paystack · Cancel anytime</p>
    </div>
  )
}
