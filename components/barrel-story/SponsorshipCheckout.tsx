'use client'
import { useState } from 'react'

interface Props {
  barrelId: string
  distilleryId: string
  token: string
  tier: string
  amountCents: number
  tierLabel: string
  brandColor: string
}

export function SponsorshipCheckout({ barrelId, distilleryId, token, tier, amountCents, tierLabel, brandColor }: Props) {
  const [sponsorName, setSponsorName] = useState('')
  const [sponsorEmail, setSponsorEmail] = useState('')
  const [isGift, setIsGift] = useState(false)
  const [giftEmail, setGiftEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function checkout() {
    if (!sponsorName.trim() || !sponsorEmail.trim()) {
      setError('Name and email are required')
      return
    }
    if (isGift && !giftEmail.trim()) {
      setError('Recipient email is required for a gift')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/sponsorships/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barrelId, distilleryId, tier, amountCents, sponsorName, sponsorEmail, isGift, giftEmail, token }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error ?? 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">{tierLabel}</span>
          <span className="text-xl font-bold">${(amountCents / 100).toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">One-time sponsorship. 10% platform fee applies.</p>
      </div>

      <div className="space-y-3">
        <input
          value={sponsorName}
          onChange={(e) => setSponsorName(e.target.value)}
          placeholder="Your name or organization"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 min-h-[44px]"
        />
        <input
          value={sponsorEmail}
          onChange={(e) => setSponsorEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 min-h-[44px]"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="w-4 h-4" />
        <span className="text-sm text-gray-300">This is a gift for someone else</span>
      </label>

      {isGift && (
        <input
          value={giftEmail}
          onChange={(e) => setGiftEmail(e.target.value)}
          placeholder="Recipient's email"
          type="email"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 min-h-[44px]"
        />
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={checkout}
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-base transition-all min-h-[52px] disabled:opacity-50"
        style={{ backgroundColor: brandColor, color: '#fff' }}
      >
        {loading ? 'Redirecting...' : `Checkout — $${(amountCents / 100).toLocaleString()}`}
      </button>

      <p className="text-xs text-center text-gray-600">Secured by Stripe. Certificate delivered via email.</p>
    </div>
  )
}
