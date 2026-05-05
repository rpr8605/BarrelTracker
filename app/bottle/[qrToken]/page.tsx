import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { getBarrelAgeMonths } from '@/lib/tags'
import type { Barrel, Batch, Distillery } from '@/types/database'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface Bottle {
  id: string
  qr_token: string
  bottle_number: string | null
  batch_id: string | null
  barrel_id: string | null
  distillery_id: string | null
  created_at: string
}

export default async function BottlePage({ params }: { params: { qrToken: string } }) {
  const { data: bottle } = await admin
    .from('bottles')
    .select('*')
    .eq('qr_token', params.qrToken)
    .single()

  if (!bottle) notFound()
  const b = bottle as Bottle

  // Fetch batch and barrel concurrently
  const [batchRes, barrelRes, distRes] = await Promise.all([
    b.batch_id ? admin.from('batches').select('*').eq('id', b.batch_id).single() : Promise.resolve({ data: null }),
    b.barrel_id ? admin.from('barrels').select('*').eq('id', b.barrel_id).single() : Promise.resolve({ data: null }),
    b.distillery_id ? admin.from('distilleries').select('*').eq('id', b.distillery_id).single() : Promise.resolve({ data: null }),
  ])

  const batch = batchRes.data as Batch | null
  const barrel = barrelRes.data as Barrel | null
  const distillery = distRes.data as Distillery | null

  // If batch has a published story page, redirect there
  if (batch?.story_page_public && batch.story_page_slug) {
    redirect(`/batches/${batch.id}/story`)
  }

  const ageMonths = getBarrelAgeMonths(barrel?.entry_date ?? null)

  return (
    <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8]">
      <div className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <span className="text-[#BA7517] font-semibold tracking-wide text-sm">Still</span>
        <span className="text-xs text-[#f5f0e8]/30">Bottle QR</span>
      </div>

      <div className="max-w-lg mx-auto px-5 py-10 space-y-8">

        {/* Bottle hero */}
        <div className="space-y-1">
          <p className="text-[#BA7517] text-xs font-medium tracking-widest uppercase">{distillery?.name ?? 'Craft Distillery'}</p>
          <h1 className="text-3xl font-semibold">
            {b.bottle_number ? `Bottle #${b.bottle_number}` : 'Your Bottle'}
          </h1>
          {batch && (
            <p className="text-[#f5f0e8]/50 text-sm mt-1">
              {batch.batch_number ?? 'Single Batch'}
              {batch.bottled_date && ` · Bottled ${formatDate(batch.bottled_date)}`}
            </p>
          )}
        </div>

        {/* Barrel details */}
        {barrel && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/8 space-y-3">
            <p className="text-xs text-[#f5f0e8]/40 uppercase tracking-widest font-medium">The Barrel</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#f5f0e8]/40 text-xs">Barrel Number</p>
                <p className="font-medium mt-0.5">{barrel.barrel_number}</p>
              </div>
              <div>
                <p className="text-[#f5f0e8]/40 text-xs">Age</p>
                <p className="font-medium mt-0.5">{ageMonths} months</p>
              </div>
              {barrel.mash_bill && (
                <div>
                  <p className="text-[#f5f0e8]/40 text-xs">Mash Bill</p>
                  <p className="font-medium mt-0.5">{barrel.mash_bill}</p>
                </div>
              )}
              {barrel.entry_proof && (
                <div>
                  <p className="text-[#f5f0e8]/40 text-xs">Entry Proof</p>
                  <p className="font-medium mt-0.5">{barrel.entry_proof}°</p>
                </div>
              )}
            </div>
            {barrel.tags && barrel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {barrel.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 bg-[#BA7517]/15 text-[#BA7517] border border-[#BA7517]/25 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch info */}
        {batch && batch.story_page_public && (
          <Link
            href={`/batches/${batch.id}/story`}
            className="flex items-center justify-between p-5 rounded-2xl bg-[#BA7517]/8 border border-[#BA7517]/20 hover:bg-[#BA7517]/12 transition-colors"
          >
            <div>
              <p className="font-medium text-sm">Read the batch story</p>
              <p className="text-xs text-[#f5f0e8]/50 mt-0.5">The full journey of {batch.batch_number ?? 'this batch'}</p>
            </div>
            <span className="text-[#BA7517] text-lg">→</span>
          </Link>
        )}

        {/* Tasting note CTA */}
        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
          <div>
            <p className="font-medium">How does it taste?</p>
            <p className="text-sm text-[#f5f0e8]/50 mt-0.5">Share your tasting notes — it only takes a minute.</p>
          </div>
          <Link
            href={`/taste/${b.id}`}
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-[#BA7517] text-white font-medium text-sm hover:bg-[#a06413] transition-colors"
          >
            Submit a Tasting Note
          </Link>
        </div>

        {/* Distillery info */}
        {distillery && (
          <div className="text-sm text-[#f5f0e8]/40 space-y-0.5">
            <p className="font-medium text-[#f5f0e8]/60">{distillery.name}</p>
            {distillery.location && <p>{distillery.location}</p>}
          </div>
        )}

        <p className="text-xs text-[#f5f0e8]/20 text-center pb-4">Powered by Still · Craft Distillery Management</p>
      </div>
    </div>
  )
}
