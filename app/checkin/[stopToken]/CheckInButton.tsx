'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface CheckInButtonProps {
  stopId: string
  passportId: string
}

export function CheckInButton({ stopId, passportId }: CheckInButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [badges, setBadges] = useState<string[]>([])

  async function handleCheckIn() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop_id: stopId, passport_id: passportId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      setBadges(data.badges_earned ?? [])
      setDone(true)
      // Trigger confetti if available
      try {
        const confetti = (await import('canvas-confetti')).default
        confetti({
          particleCount: 120,
          spread: 80,
          colors: ['#BA7517', '#FAC775', '#854F0B', '#f5f0e8'],
          origin: { y: 0.6 },
        })
      } catch {
        // canvas-confetti not installed — silent
      }
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#BA7517]/10 border border-[#BA7517]/30">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold text-[#BA7517]">Checked in!</p>
            <p className="text-sm text-[var(--color-text-muted)]">This stop is stamped in your passport.</p>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/5 border border-[#BA7517]/20 space-y-2">
            <p className="text-xs font-semibold text-[#BA7517] uppercase tracking-widest">Badge{badges.length > 1 ? 's' : ''} Earned</p>
            {badges.map((slug) => (
              <div key={slug} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                <span>🏅</span>
                <span className="font-medium">{slug.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-400 bg-red-900/10 border border-red-900/20 rounded-lg px-3 py-2">{error}</p>
      )}
      <Button onClick={handleCheckIn} loading={loading} size="lg" className="w-full">
        {loading ? 'Checking in…' : 'Check In Here'}
      </Button>
    </div>
  )
}
