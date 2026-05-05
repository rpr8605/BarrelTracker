import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Barrel, Batch, Distillery } from '@/types/database'
import { TastingNoteForm } from './TastingNoteForm'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface Bottle {
  id: string
  qr_token: string | null
  bottle_number: string | null
  batch_id: string | null
  barrel_id: string | null
  distillery_id: string | null
}

export default async function TastePage({ params }: { params: { bottleId: string } }) {
  const { data: bottle } = await admin
    .from('bottles')
    .select('*')
    .eq('id', params.bottleId)
    .single()

  if (!bottle) notFound()
  const b = bottle as Bottle

  const [batchRes, barrelRes, distRes, tagsRes] = await Promise.all([
    b.batch_id ? admin.from('batches').select('*').eq('id', b.batch_id).single() : Promise.resolve({ data: null }),
    b.barrel_id ? admin.from('barrels').select('*').eq('id', b.barrel_id).single() : Promise.resolve({ data: null }),
    b.distillery_id ? admin.from('distilleries').select('*').eq('id', b.distillery_id).single() : Promise.resolve({ data: null }),
    admin.from('tag_library').select('tag').eq('category', 'flavor').order('usage_count', { ascending: false }).limit(80),
  ])

  const batch = batchRes.data as Batch | null
  const barrel = barrelRes.data as Barrel | null
  const distillery = distRes.data as Distillery | null
  const flavorTags = (tagsRes.data ?? []).map((t: { tag: string }) => t.tag)

  return (
    <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8]">
      <div className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <span className="text-[#BA7517] font-semibold tracking-wide text-sm">Still</span>
        <span className="text-xs text-[#f5f0e8]/30">Tasting Note</span>
      </div>

      <div className="max-w-lg mx-auto px-5 py-10 space-y-8">
        <div>
          <p className="text-[#BA7517] text-xs font-medium tracking-widest uppercase">{distillery?.name ?? 'Craft Distillery'}</p>
          <h1 className="text-2xl font-semibold mt-1">
            {b.bottle_number ? `Bottle #${b.bottle_number}` : 'Your Tasting Note'}
          </h1>
          {batch && (
            <p className="text-[#f5f0e8]/50 text-sm mt-1">{batch.batch_number ?? 'Single Batch'}</p>
          )}
        </div>

        <TastingNoteForm
          bottleId={b.id}
          barrelId={b.barrel_id ?? undefined}
          distilleryId={b.distillery_id ?? undefined}
          batchId={b.batch_id ?? undefined}
          flavorTags={flavorTags}
          storyUrl={batch?.story_page_public && batch.id ? `/batches/${batch.id}/story` : undefined}
        />

        <p className="text-xs text-[#f5f0e8]/20 text-center pb-4">Powered by Still · Craft Distillery Management</p>
      </div>
    </div>
  )
}
