import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { getBarrelAgeMonths } from '@/lib/tags'
import type { Batch, Barrel } from '@/types/database'
import type { Metadata } from 'next'
import { ShareButton } from './ShareButton'

export const dynamic = 'force-dynamic'

interface TastingNoteRow {
  id: string
  rating: number | null
  notes: string | null
  flavor_tags: string[] | null
  created_at: string
  consumer_profiles: { display_name: string } | null
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createServiceClient()
  const { data: batch } = await supabase.from('batches').select('batch_number, story_page_public').eq('id', params.id).single()
  if (!batch?.story_page_public) return {}
  const title = batch.batch_number ? `${batch.batch_number} — Batch Story` : 'Batch Story'
  const ogUrl = `/api/og?type=batch&batchNumber=${encodeURIComponent(batch.batch_number || 'Batch')}`
  return {
    title,
    openGraph: { title, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, images: [ogUrl] },
  }
}

export default async function StoryPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data: batch } = await supabase.from('batches').select('*').eq('id', params.id).single()
  if (!batch || !batch.story_page_public) notFound()

  const b = batch as Batch

  const [barrelsResult, notesResult] = await Promise.all([
    b.barrel_ids?.length
      ? supabase.from('barrels').select('*').in('id', b.barrel_ids)
      : Promise.resolve({ data: [] }),
    supabase
      .from('tasting_notes')
      .select('id, rating, notes, flavor_tags, created_at, consumer_profiles(display_name)')
      .eq('batch_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const barrels = (barrelsResult.data || []) as Barrel[]
  const tastingNotes = (notesResult.data || []) as TastingNoteRow[]

  const avgRating = tastingNotes.length
    ? tastingNotes.filter((n) => n.rating).reduce((s, n) => s + (n.rating || 0), 0) /
      tastingNotes.filter((n) => n.rating).length
    : null

  return (
    <div className="min-h-screen bg-[#0f0c08] text-[#f5efe3]">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="text-[#BA7517] text-sm font-medium mb-2 tracking-wider uppercase">Still</div>
        <h1 className="text-3xl font-medium mb-1">{b.batch_number || 'Batch Story'}</h1>
        {b.bottled_date && <p className="text-[#c9b48a] text-sm mb-2">Bottled {formatDate(b.bottled_date)}</p>}

        {avgRating && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[#BA7517] text-lg">{renderStars(avgRating)}</span>
            <span className="text-[#c9b48a] text-sm">{avgRating.toFixed(1)} · {tastingNotes.filter(n => n.rating).length} {tastingNotes.filter(n => n.rating).length === 1 ? 'review' : 'reviews'}</span>
          </div>
        )}

        <div className="flex gap-3 mb-8">
          <ShareButton />
        </div>

        {b.story_content && (
          <div className="text-[#f5efe3]/80 leading-8 text-lg space-y-4 mb-10 whitespace-pre-wrap">
            {b.story_content}
          </div>
        )}

        {barrels.length > 0 && (
          <div className="border-t border-[#BA7517]/20 pt-8 mt-8">
            <h2 className="text-sm font-medium text-[#BA7517] mb-4 tracking-wider uppercase">The barrels</h2>
            <div className="space-y-4">
              {barrels.map((barrel) => (
                <div key={barrel.id} className="flex items-start justify-between border-b border-white/5 pb-4">
                  <div>
                    <div className="font-medium">{barrel.barrel_number}</div>
                    <div className="text-sm text-[#c9b48a] mt-0.5">
                      {barrel.mash_bill || barrel.distillery_source}
                      {barrel.warehouse_row && ` · Row ${barrel.warehouse_row}`}
                    </div>
                    {barrel.tags && barrel.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {barrel.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#BA7517]/15 text-[#c9b48a]">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-[#c9b48a] shrink-0 ml-4">
                    <div>{getBarrelAgeMonths(barrel.entry_date)} months</div>
                    <div>{formatDate(barrel.entry_date)}</div>
                    {barrel.angels_share_pct && <div>{barrel.angels_share_pct.toFixed(1)}% angel's share</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {b.bottle_count && (
          <div className="mt-8 text-sm text-[#c9b48a] flex gap-4 flex-wrap">
            <span>{b.bottle_count.toLocaleString()} bottles produced</span>
            {b.yield_gallons && <span>{b.yield_gallons} gal yield</span>}
          </div>
        )}

        {tastingNotes.length > 0 && (
          <div className="border-t border-[#BA7517]/20 pt-8 mt-8">
            <h2 className="text-sm font-medium text-[#BA7517] mb-6 tracking-wider uppercase">What people are saying</h2>
            <div className="space-y-6">
              {tastingNotes.map((note) => (
                <div key={note.id} className="pb-6 border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#f5efe3]">
                      {note.consumer_profiles?.display_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-[#c9b48a]/60">{formatDate(note.created_at)}</span>
                  </div>
                  {note.rating && (
                    <div className="text-[#BA7517] text-sm mb-2">{renderStars(note.rating)}</div>
                  )}
                  {note.flavor_tags && note.flavor_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {note.flavor_tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#BA7517]/15 text-[#c9b48a]">{tag}</span>
                      ))}
                    </div>
                  )}
                  {note.notes && (
                    <p className="text-sm text-[#f5efe3]/70 leading-relaxed">{note.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <a
            href={`/taste/${params.id}`}
            className="inline-block bg-[#BA7517] text-black text-sm font-medium px-6 py-3 rounded-full hover:bg-[#d4861e] transition-colors mb-4"
          >
            Leave a tasting note
          </a>
          <div className="text-xs text-white/20 mt-4">Powered by Still · Craft Distillery Management</div>
        </div>
      </div>
    </div>
  )
}

function renderStars(rating: number): string {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}
