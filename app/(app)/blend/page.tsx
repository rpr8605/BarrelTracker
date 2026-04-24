'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BlendCard } from '@/components/ai/BlendCard'
import { createClient } from '@/lib/supabase'
import type { Barrel } from '@/types/database'
import type { BlendRecommendation } from '@/types/api'

export default function BlendPage() {
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [blends, setBlends] = useState<BlendRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('barrels')
      .select('*')
      .in('status', ['ready', 'aging'])
      .order('profile_match_score', { ascending: false })
      .then(({ data }) => { setBarrels((data || []) as Barrel[]); setLoading(false) })
  }, [])

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barrel_ids: barrels.map((b) => b.id) }),
      })
      const data = await res.json()
      setBlends(data.blends || [])
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  async function approve(blend: BlendRecommendation) {
    setApproving(blend.name)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: dist } = await supabase.from('distilleries').select('id').eq('owner_id', user!.id).limit(1).single()

    await supabase.from('batches').insert({
      distillery_id: dist?.id,
      batch_number: `BATCH-${Date.now()}`,
      barrel_ids: blend.barrel_ids,
      blend_ratios: blend.blend_ratios,
      projected_flavor_profile: blend.projected_flavor_profile,
      bottle_count: blend.bottle_count,
      yield_gallons: blend.yield_gallons,
      cost_per_bottle: blend.cost_per_bottle,
    })

    setApproving(null)
    setBlends((prev) => prev.filter((b) => b.name !== blend.name))
    alert(`Batch "${blend.name}" created!`)
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-medium text-lg">Blending</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{barrels.length} barrels available</p>
        </div>
        <Button onClick={generate} loading={generating} disabled={barrels.length === 0}>
          Generate recommendations
        </Button>
      </div>

      {blends.length > 0 && (
        <div className="space-y-4">
          {blends.map((blend, i) => (
            <BlendCard
              key={blend.name}
              blend={blend}
              rank={i + 1}
              onApprove={approve}
              approving={approving === blend.name}
            />
          ))}
        </div>
      )}

      {blends.length === 0 && !generating && (
        <Card className="text-center py-10">
          <div className="text-3xl mb-3">⟳</div>
          <p className="font-medium mb-1">Ready to blend</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Hit Generate to get AI-powered blend recommendations matched to your taste profile
          </p>
        </Card>
      )}

      {generating && (
        <div className="text-center py-10">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">AI is crafting your recommendations…</p>
        </div>
      )}
    </div>
  )
}
