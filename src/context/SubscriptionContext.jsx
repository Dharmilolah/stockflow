import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const SubscriptionContext = createContext({})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    color: '#6b7280',
    limits: { products: 10, salesPerMonth: 50 },
    features: ['Up to 10 products', '50 sales/month', 'Basic dashboard', 'Email support']
  },
  basic: {
    name: 'Basic',
    price: 2500,
    color: '#4f46e5',
    limits: { products: 200, salesPerMonth: 1000 },
    features: ['Up to 200 products', '1,000 sales/month', 'Full reports', 'Stock history', 'Priority support']
  },
  pro: {
    name: 'Pro',
    price: 5000,
    color: '#10b981',
    limits: { products: Infinity, salesPerMonth: Infinity },
    features: ['Unlimited products', 'Unlimited sales', 'Advanced analytics', 'Invoice export (soon)', 'WhatsApp support']
  }
}

export function SubscriptionProvider({ children }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState({ products: 0, salesThisMonth: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const [subRes, productsRes, salesRes] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
      supabase.from('products').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('sales').select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('sold_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    // Create free subscription if none exists
    if (!subRes.data) {
      const { data } = await supabase.from('subscriptions')
        .upsert({ user_id: user.id, plan: 'free', status: 'active' })
        .select().single()
      setSubscription(data)
    } else {
      setSubscription(subRes.data)
    }

    setUsage({ products: productsRes.count || 0, salesThisMonth: salesRes.count || 0 })
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const plan = subscription?.plan || 'free'
  const planInfo = PLANS[plan]
  const limits = planInfo?.limits || PLANS.free.limits

  const canAddProduct = usage.products < limits.products
  const canRecordSale = usage.salesThisMonth < limits.salesPerMonth

  function withinLimit(type) {
    if (type === 'product') return canAddProduct
    if (type === 'sale') return canRecordSale
    return true
  }

  return (
    <SubscriptionContext.Provider value={{ subscription, plan, planInfo, limits, usage, loading, canAddProduct, canRecordSale, withinLimit, reload: load }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => useContext(SubscriptionContext)
