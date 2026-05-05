'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface AdoptButtonsProps {
  barrelId: string
  tier: 'full' | 'share'
  distilleryName: string
}

export function AdoptButtons({ barrelId, tier, distilleryName }: AdoptButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleAdopt() {
    setLoading(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/signup?return=/adopt/${barrelId}`)
        return
      }

      const res = await fetch('/api/adoptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barrelId, tier, returnUrl: window.location.href }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.message) {
        setMessage(data.message)
      } else if (data.error) {
        setMessage(data.error)
      }
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAdopt}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-[#BA7517] text-white font-medium text-sm hover:bg-[#a06413] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {tier === 'full' ? 'Adopt This Barrel' : 'Adopt a Share'}
      </button>
      {message && (
        <p className="text-xs text-[#f5f0e8]/60 text-center leading-relaxed">
          Stripe checkout is not yet configured — contact <span className="text-[#BA7517]">{distilleryName}</span> directly to adopt this barrel.
        </p>
      )}
    </div>
  )
}
