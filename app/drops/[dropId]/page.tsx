'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, formatCurrency } from '@/lib/utils'

interface DropEvent {
  id: string
  distillery_id: string
  title: string
  description: string | null
  barrel_id: string | null
  batch_id: string | null
  total_bottles: number
  bottles_remaining: number
  price_per_bottle: number
  opens_at: string | null
  closes_at: string | null
  status: 'waitlist' | 'open' | 'closed' | 'sold_out'
  distilleries?: { name: string; slug: string | null }
  barrels?: { barrel_number: string; mash_bill: string | null; entry_date: string | null; tags: string[] | null } | null
  batches?: { batch_number: string | null; story_content: string | null } | null
}

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState<number>(0)

  useEffect(() => {
    if (!target) return
    const tick = () => setDiff(new Date(target).getTime() - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  if (!target || diff <= 0) return null

  const s = Math.floor(diff / 1000)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60

  return { days, hours, mins, secs }
}

function CountdownTimer({ target }: { target: string }) {
  const cd = useCountdown(target)
  if (!cd) return <span className="text-[#BA7517]">Opening soon</span>

  return (
    <div className="flex gap-4 justify-center my-6">
      {[['days', cd.days], ['hours', cd.hours], ['mins', cd.mins], ['secs', cd.secs]].map(([label, val]) => (
        <div key={label as string} className="text-center">
          <div className="text-3xl font-bold text-[#BA7517] tabular-nums w-16">
            {String(val).padStart(2, '0')}
          </div>
          <div className="text-xs text-[#f5f0e8]/40 uppercase tracking-wider mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function DropPage({ params }: { params: { dropId: string } }) {
  const [drop, setDrop] = useState<DropEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [joining, setJoining] = useState(false)
  const [position, setPosition] = useState<number | null>(null)
  const [bottleCount, setBottleCount] = useState(1)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<{ url?: string; message?: string; email?: string } | null>(null)
  const [bottlesRemaining, setBottlesRemaining] = useState<number | null>(null)
  const [bottlesAnimation, setBottlesAnimation] = useState(false)

  const fetchDrop = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('drop_events')
      .select('*, distilleries(name, slug), barrels(barrel_number, mash_bill, entry_date, tags), batches(batch_number, story_content)')
      .eq('id', params.dropId)
      .single()

    if (data) {
      setDrop(data as DropEvent)
      setBottlesRemaining(data.bottles_remaining)
    }
    setLoading(false)
  }, [params.dropId])

  useEffect(() => {
    fetchDrop()
  }, [fetchDrop])

  useEffect(() => {
    if (!drop || drop.status !== 'open') return
    const supabase = createClient()
    const channel = supabase
      .channel(`drop-${drop.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'drop_events',
        filter: `id=eq.${drop.id}`,
      }, (payload) => {
        const newRemaining = (payload.new as DropEvent).bottles_remaining
        setBottlesAnimation(true)
        setBottlesRemaining(newRemaining)
        setTimeout(() => setBottlesAnimation(false), 600)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [drop])

  async function joinWaitlist() {
    if (!email || !name) return
    setJoining(true)
    try {
      const res = await fetch(`/api/drops/${params.dropId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (data.position) setPosition(data.position)
    } finally {
      setJoining(false)
    }
  }

  async function purchase() {
    if (!drop) return
    setPurchasing(true)
    try {
      const res = await fetch(`/api/drops/${params.dropId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bottleCount }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPurchaseResult(data)
      }
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0b07] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#BA7517] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8] flex items-center justify-center">
        <p className="text-[#f5f0e8]/40">Release not found.</p>
      </div>
    )
  }

  const now = Date.now()
  const opensAt = drop.opens_at ? new Date(drop.opens_at).getTime() : null
  const closesAt = drop.closes_at ? new Date(drop.closes_at).getTime() : null
  const isPreOpen = drop.status === 'waitlist' || (opensAt !== null && opensAt > now)
  const isOpen = drop.status === 'open' && opensAt !== null && opensAt <= now && (closesAt === null || closesAt > now)
  const isClosed = drop.status === 'closed' || drop.status === 'sold_out' || (closesAt !== null && closesAt <= now)
  const distilleryName = drop.distilleries?.name || 'the distillery'

  return (
    <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8]">
      <div className="max-w-xl mx-auto px-5 py-12">
        <div className="text-[#BA7517] text-xs font-medium tracking-widest uppercase mb-6">
          {distilleryName}
        </div>

        <h1 className="text-3xl font-medium mb-2">{drop.title}</h1>
        {drop.description && (
          <p className="text-[#f5f0e8]/60 leading-7 mb-8">{drop.description}</p>
        )}

        {/* Barrel / Batch Story */}
        {(drop.barrels || drop.batches) && (
          <div className="border border-[#BA7517]/20 rounded-xl p-5 mb-8 space-y-3">
            {drop.batches?.story_content && (
              <p className="text-[#f5f0e8]/70 leading-7 text-sm">{drop.batches.story_content}</p>
            )}
            {drop.barrels && (
              <div className="flex flex-wrap gap-2 mt-3">
                {drop.barrels.mash_bill && (
                  <span className="text-xs px-2 py-1 rounded-full bg-[#BA7517]/10 text-[#BA7517]">
                    {drop.barrels.mash_bill}
                  </span>
                )}
                {drop.barrels.entry_date && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-[#f5f0e8]/50">
                    Entered {formatDate(drop.barrels.entry_date)}
                  </span>
                )}
                {drop.barrels.tags?.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 text-[#f5f0e8]/50">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRE-OPEN */}
        {isPreOpen && (
          <div className="space-y-6">
            <div className="text-center border border-white/10 rounded-xl p-6">
              <p className="text-sm text-[#f5f0e8]/50 mb-1">Opening</p>
              <p className="text-lg font-medium">
                {drop.opens_at ? formatDate(drop.opens_at) : 'TBD'} — {formatCurrency(drop.price_per_bottle)} per bottle
              </p>
              {drop.opens_at && <CountdownTimer target={drop.opens_at} />}
            </div>

            {position ? (
              <div className="text-center py-6 border border-[#BA7517]/30 rounded-xl bg-[#BA7517]/5">
                <p className="text-[#BA7517] text-sm font-medium">You&apos;re on the list</p>
                <p className="text-3xl font-bold mt-1">#{position}</p>
                <p className="text-[#f5f0e8]/40 text-sm mt-1">in line</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#f5f0e8]/70">Join the waitlist</p>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/30"
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/30"
                />
                <Button
                  onClick={joinWaitlist}
                  loading={joining}
                  className="w-full bg-[#BA7517] hover:bg-[#a36614] text-white"
                  disabled={!name || !email}
                >
                  Join Waitlist
                </Button>
              </div>
            )}
          </div>
        )}

        {/* OPEN */}
        {isOpen && (
          <div className="space-y-6">
            <div className={`flex items-center gap-3 border border-[#BA7517]/40 rounded-xl p-4 transition-all ${bottlesAnimation ? 'bg-[#BA7517]/10' : ''}`}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-[#BA7517]">Live Now</p>
                <p className="text-2xl font-bold transition-all">
                  <span className={`inline-block transition-transform ${bottlesAnimation ? 'scale-110' : ''}`}>
                    {bottlesRemaining ?? drop.bottles_remaining}
                  </span>
                  <span className="text-base font-normal text-[#f5f0e8]/50 ml-2">bottles remaining</span>
                </p>
              </div>
            </div>

            {purchaseResult ? (
              <div className="border border-white/10 rounded-xl p-5 text-center space-y-2">
                <p className="text-[#f5f0e8]/70">{purchaseResult.message}</p>
                {purchaseResult.email && (
                  <a href={`mailto:${purchaseResult.email}`} className="text-[#BA7517] underline text-sm">
                    {purchaseResult.email}
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-[#f5f0e8]/70 w-28">Bottles</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBottleCount(Math.max(1, bottleCount - 1))}
                      className="w-9 h-9 rounded-lg border border-white/10 text-[#f5f0e8] hover:border-[#BA7517] transition-colors"
                    >−</button>
                    <span className="w-8 text-center font-medium text-lg">{bottleCount}</span>
                    <button
                      onClick={() => setBottleCount(Math.min(6, bottleCount + 1))}
                      className="w-9 h-9 rounded-lg border border-white/10 text-[#f5f0e8] hover:border-[#BA7517] transition-colors"
                    >+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-[#f5f0e8]/50">
                  <span>Total</span>
                  <span className="text-[#f5f0e8] font-medium text-base">
                    {formatCurrency(bottleCount * drop.price_per_bottle)}
                  </span>
                </div>
                <Button
                  onClick={purchase}
                  loading={purchasing}
                  className="w-full bg-[#BA7517] hover:bg-[#a36614] text-white"
                >
                  Purchase — {formatCurrency(bottleCount * drop.price_per_bottle)}
                </Button>
                <p className="text-xs text-[#f5f0e8]/30 text-center">Maximum 6 bottles per order</p>
              </div>
            )}
          </div>
        )}

        {/* CLOSED / SOLD OUT */}
        {isClosed && (
          <div className="text-center py-10 space-y-4">
            <p className="text-[#f5f0e8]/40 text-lg">This release has closed.</p>
            {drop.distilleries?.slug && (
              <a
                href={`/adopt/${drop.distilleries.slug}`}
                className="inline-block text-[#BA7517] text-sm underline"
              >
                View future releases from {distilleryName} →
              </a>
            )}
          </div>
        )}

        <div className="mt-16 text-xs text-white/15 text-center">Powered by Still · Craft Distillery Management</div>
      </div>
    </div>
  )
}
