import { useState } from 'react'
import { useSubscription, PLANS } from '../context/SubscriptionContext'
import Pricing from '../pages/Pricing'

export default function UpgradeBanner({ type }) {
  const { plan, planInfo, usage, limits } = useSubscription()
  const [showPricing, setShowPricing] = useState(false)

  if (plan === 'pro') return null

  const isProductLimit = type === 'product' && usage.products >= limits.products
  const isSaleLimit = type === 'sale' && usage.salesThisMonth >= limits.salesPerMonth

  if (!isProductLimit && !isSaleLimit) return null

  const nextPlan = plan === 'free' ? PLANS.basic : PLANS.pro
  const nextPlanKey = plan === 'free' ? 'basic' : 'pro'

  return (
    <>
      <div className="upgrade-banner">
        <div className="upgrade-text">
          <span className="upgrade-icon">⚡</span>
          <div>
            <strong>
              {isProductLimit
                ? `You've reached ${limits.products} products (${planInfo.name} limit)`
                : `You've reached ${limits.salesPerMonth} sales this month (${planInfo.name} limit)`}
            </strong>
            <p>Upgrade to {nextPlan.name} for ₦{nextPlan.price.toLocaleString()}/month to continue</p>
          </div>
        </div>
        <button className="upgrade-btn" onClick={() => setShowPricing(true)}>
          Upgrade Now →
        </button>
      </div>

      {showPricing && <Pricing onClose={() => setShowPricing(false)} />}
    </>
  )
}
