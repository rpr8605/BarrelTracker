'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface BarrelCard {
  id: string
  barrel_number: string
  grain_type: string[] | null
  mash_bill: string | null
  entry_date: string | null
  status: string
  tags: string[] | null
}

interface DistilleryInfo {
  id: string
  name: string
  location: string | null
}

function ageMonths(entryDate: string | null): number | null {
  if (!entryDate) return null
  const ms = Date.now() - new Date(entryDate).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44))
}

function formatAge(months: number | null): string {
  if (months === null) return '—'
  if (months < 12) return `${months}mo`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? `${y}yr ${m}mo` : `${y}yr`
}

export default function FlightsPage({ params }: { params: { distillerySlug: string } }) {
  const [distillery, setDistillery] = useState<DistilleryInfo | null>(null)
  const [barrels, setBarrels] = useState<BarrelCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pairingNote, setPairingNote] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [captureStep, setCaptureStep] = useState(false)
  const [captureName, setCaptureName] = useState('')
  const [captureEmail, setCaptureEmail] = useState('')
  const [capturing, setCapturing] = useState(false)
  const [captured, setCaptured] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    // Look up distillery by slug column or name match
    const { data: distData } = await supabase
      .from('distilleries')
      .select('id, name, location')
      .or(`slug.eq.${params.distillerySlug},name.ilike.${decodeURIComponent(params.distillerySlug).replace(/-/g, ' ')}`)
      .limit(1)
      .maybeSingle()

    if (!distData) {
      setLoading(false)
      return
    }

    setDistillery(distData as DistilleryInfo)

    const { data: barrelData } = await supabase
      .from('barrels')
      .select('id, barrel_number, grain_type, mash_bill, entry_date, status, tags')
      .eq('distillery_id', distData.id)
      .in('status', ['aging', 'ready'])
      .limit(24)

    setBarrels((barrelData || []) as BarrelCard[])
    setLoading(false)
  }, [params.distillerySlug])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleBarrel(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 5) {
        next.add(id)
      }
      return next
    })
  }

  async function buildFlight() {
    if (selected.size < 2 || !distillery) return
    setGenerating(true)
    setPairingNote(null)
    try {
      const res = await fetch('/api/ai/flight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barrelIds: Array.from(selected),
          distilleryName: distillery.name,
        }),
      })
      const data = await res.json()
      if (data.pairingNote) setPairingNote(data.pairingNote)
    } finally {
      setGenerating(false)
    }
  }

  async function captureFlight() {
    if (!captureEmail || !captureName || !distillery) return
    setCapturing(true)
    try {
      await fetch('/api/flights/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: captureName,
          email: captureEmail,
          barrelIds: Array.from(selected),
          distilleryId: distillery.id,
        }),
      })
      setCaptured(true)
    } finally {
      setCapturing(false)
    }
  }

  function startOver() {
    setSelected(new Set())
    setPairingNote(null)
    setCaptureStep(false)
    setCaptured(false)
    setCaptureName('')
    setCaptureEmail('')
  }

  const selectedBarrels = barrels.filter((b) => selected.has(b.id))

  if (loading) return (
    <div className="min-h-screen bg-[#0f0b07] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#BA7517] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!distillery) return (
    <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8] flex items-center justify-center">
      <p className="text-[#f5f0e8]/40">Distillery not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8]">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="text-[#BA7517] text-xs font-medium tracking-widest uppercase mb-2">
            {distillery.name}
          </div>
          <h1 className="text-2xl font-medium">Build Your Flight</h1>
          <p className="text-[#f5f0e8]/50 text-sm mt-1">
            Choose 2–5 barrels to craft your personal tasting experience
          </p>
        </div>

        {/* Flight result */}
        {pairingNote && (
          <div className="mb-8 border border-[#BA7517]/30 rounded-2xl p-6 bg-[#BA7517]/5">
            <h2 className="text-[#BA7517] text-sm font-medium mb-3">
              Your {selectedBarrels.length}-Barrel Flight
            </h2>
            <div className="space-y-2 mb-4">
              {selectedBarrels.map((b) => {
                const months = ageMonths(b.entry_date)
                const grain = b.grain_type?.join(', ') || b.mash_bill || '—'
                return (
                  <div key={b.id} className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[#BA7517] shrink-0" />
                    <span className="font-medium">{b.barrel_number}</span>
                    <span className="text-[#f5f0e8]/40">{grain}</span>
                    <span className="text-[#f5f0e8]/40 ml-auto shrink-0">{formatAge(months)}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-[#f5f0e8]/80 leading-7 text-sm italic">{pairingNote}</p>

            {/* Email capture */}
            {!captured ? (
              captureStep ? (
                <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                  <p className="text-sm font-medium">Save your tasting notes</p>
                  <p className="text-xs text-[#f5f0e8]/40">Get release notifications when these barrels are ready.</p>
                  <Input
                    placeholder="Your name"
                    value={captureName}
                    onChange={(e) => setCaptureName(e.target.value)}
                    className="bg-white/5 border-white/10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/30"
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={captureEmail}
                    onChange={(e) => setCaptureEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/30"
                  />
                  <Button
                    onClick={captureFlight}
                    loading={capturing}
                    disabled={!captureName || !captureEmail}
                    className="w-full bg-[#BA7517] hover:bg-[#a36614] text-white"
                    size="sm"
                  >
                    Save & Subscribe
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setCaptureStep(true)}
                  className="mt-4 text-sm text-[#BA7517] underline"
                >
                  Save tasting notes &amp; get release notifications →
                </button>
              )
            ) : (
              <div className="mt-4 text-sm text-green-400">
                Saved! We&apos;ll notify you when these barrels are ready.
              </div>
            )}

            <button onClick={startOver} className="mt-5 block text-xs text-[#f5f0e8]/30 hover:text-[#f5f0e8]/60">
              ← Start over
            </button>
          </div>
        )}

        {/* Barrel grid */}
        {!pairingNote && (
          <>
            {barrels.length === 0 ? (
              <div className="text-center py-16 text-[#f5f0e8]/30">
                No barrels currently available for tasting.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {barrels.map((barrel) => {
                  const isSelected = selected.has(barrel.id)
                  const months = ageMonths(barrel.entry_date)
                  const grain = barrel.grain_type?.join(', ') || barrel.mash_bill || 'Unknown grain'
                  return (
                    <button
                      key={barrel.id}
                      onClick={() => toggleBarrel(barrel.id)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#BA7517] bg-[#BA7517]/10'
                          : 'border-white/10 bg-white/3 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{barrel.barrel_number}</span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-[#BA7517] text-white flex items-center justify-center text-xs shrink-0">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-[#f5f0e8]/50 mt-0.5">{grain}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-[#f5f0e8]/50">{formatAge(months)}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                            barrel.status === 'ready' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {barrel.status === 'ready' ? 'Ready' : 'Aging'}
                          </span>
                        </div>
                      </div>
                      {barrel.tags && barrel.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {barrel.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-[#f5f0e8]/40">{tag}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {selected.size >= 2 && (
              <div className="sticky bottom-6 flex justify-center">
                <Button
                  onClick={buildFlight}
                  loading={generating}
                  className="bg-[#BA7517] hover:bg-[#a36614] text-white px-8 shadow-xl shadow-black/50"
                  size="lg"
                >
                  {generating ? 'Crafting your flight…' : `Build My ${selected.size}-Barrel Flight`}
                </Button>
              </div>
            )}

            {selected.size > 0 && selected.size < 2 && (
              <p className="text-center text-sm text-[#f5f0e8]/30">
                Select {2 - selected.size} more barrel{2 - selected.size > 1 ? 's' : ''} to build your flight
              </p>
            )}

            {barrels.length > 0 && selected.size === 0 && (
              <p className="text-center text-sm text-[#f5f0e8]/30">Tap any barrel to select it</p>
            )}
          </>
        )}

        <div className="mt-16 text-xs text-white/15 text-center">Powered by Still · Craft Distillery Management</div>
      </div>
    </div>
  )
}
