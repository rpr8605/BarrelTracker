'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TagChip } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'
import { formatDate, formatCurrency, slugify } from '@/lib/utils'
import type { Batch, Barrel } from '@/types/database'
import Link from 'next/link'

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('batches').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setBatch(data as Batch)
        if (data.barrel_ids?.length) {
          supabase.from('barrels').select('*').in('id', data.barrel_ids).then(({ data: b }) => {
            setBarrels((b || []) as Barrel[])
          })
        }
      }
    })
  }, [id])

  async function generateStory() {
    if (!batch) return
    setGenerating(true)
    const res = await fetch('/api/ai/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batch.id }),
    })
    const data = await res.json()
    const supabase = createClient()
    await supabase.from('batches').update({ story_content: data.story }).eq('id', batch.id)
    setBatch((b) => b ? { ...b, story_content: data.story } : b)
    setGenerating(false)
  }

  async function togglePublish() {
    if (!batch) return
    setPublishing(true)
    const slug = batch.story_page_slug || slugify(`${batch.batch_number || 'batch'}-${batch.id.slice(-6)}`)
    const supabase = createClient()
    await supabase.from('batches').update({ story_page_public: !batch.story_page_public, story_page_slug: slug }).eq('id', batch.id)
    setBatch((b) => b ? { ...b, story_page_public: !b.story_page_public, story_page_slug: slug } : b)
    setPublishing(false)
  }

  if (!batch) return (
    <div className="space-y-3">
      {[1,2].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/batches" className="hover:text-[var(--color-text)]">Batches</Link>
        <span>›</span>
        <span className="text-[var(--color-text)]">{batch.batch_number || 'Batch'}</span>
      </div>

      <Card className="space-y-3">
        <h1 className="font-medium text-lg">{batch.batch_number || 'Unnamed batch'}</h1>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {batch.bottle_count && <div><div className="text-xs text-[var(--color-text-muted)]">Bottles</div><div className="font-medium">{batch.bottle_count}</div></div>}
          {batch.yield_gallons && <div><div className="text-xs text-[var(--color-text-muted)]">Yield</div><div className="font-medium">{batch.yield_gallons}gal</div></div>}
          {batch.cost_per_bottle && <div><div className="text-xs text-[var(--color-text-muted)]">Cost/bottle</div><div className="font-medium">{formatCurrency(batch.cost_per_bottle)}</div></div>}
        </div>
        {batch.projected_flavor_profile && (
          <p className="text-sm text-[var(--color-text-secondary)]">{batch.projected_flavor_profile}</p>
        )}
      </Card>

      {barrels.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium mb-3">Barrels in batch</h3>
          <div className="space-y-2">
            {barrels.map((barrel) => (
              <div key={barrel.id} className="flex items-center justify-between text-sm">
                <Link href={`/barrels/${barrel.id}`} className="text-primary hover:underline">{barrel.barrel_number}</Link>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-muted)]">{barrel.mash_bill}</span>
                  {batch.blend_ratios?.[barrel.id] && (
                    <TagChip tag={`${batch.blend_ratios[barrel.id]}%`} amber />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Story page</h3>
          {batch.story_page_slug && batch.story_page_public && (
            <Link href={`/batches/${batch.id}/story`} target="_blank" className="text-xs text-primary hover:underline">
              View public page →
            </Link>
          )}
        </div>

        {batch.story_content ? (
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{batch.story_content}</p>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">No story written yet</p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={generateStory} loading={generating} className="flex-1">
            {batch.story_content ? 'Regenerate story' : 'Generate story'}
          </Button>
          {batch.story_content && (
            <Button onClick={togglePublish} loading={publishing} className="flex-1" variant={batch.story_page_public ? 'secondary' : 'primary'}>
              {batch.story_page_public ? 'Unpublish' : 'Publish story'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
