import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { getBarrelAgeMonths } from '@/lib/tags'
import type { Batch, Barrel } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function StoryPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data: batch } = await supabase.from('batches').select('*').eq('id', params.id).single()
  if (!batch || !batch.story_page_public) notFound()

  const b = batch as Batch

  const barrels = b.barrel_ids?.length
    ? ((await supabase.from('barrels').select('*').in('id', b.barrel_ids)).data || []) as Barrel[]
    : []

  return (
    <div className="min-h-screen bg-[#0f0c08] text-[#f5efe3]">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="text-primary text-sm font-medium mb-2 tracking-wider uppercase">Still</div>
        <h1 className="text-3xl font-medium mb-1">{b.batch_number || 'Batch Story'}</h1>
        {b.bottled_date && <p className="text-[#c9b48a] text-sm mb-8">Bottled {formatDate(b.bottled_date)}</p>}

        {b.story_content && (
          <div className="text-[#f5efe3]/80 leading-8 text-lg space-y-4 mb-10 whitespace-pre-wrap">
            {b.story_content}
          </div>
        )}

        {barrels.length > 0 && (
          <div className="border-t border-primary/20 pt-8 mt-8">
            <h2 className="text-sm font-medium text-primary mb-4">The barrels</h2>
            <div className="space-y-4">
              {barrels.map((barrel) => (
                <div key={barrel.id} className="flex items-start justify-between border-b border-white/5 pb-4">
                  <div>
                    <div className="font-medium">{barrel.barrel_number}</div>
                    <div className="text-sm text-[#c9b48a] mt-0.5">
                      {barrel.mash_bill || barrel.distillery_source}
                      {barrel.warehouse_row && ` · Row ${barrel.warehouse_row}`}
                    </div>
                  </div>
                  <div className="text-right text-sm text-[#c9b48a]">
                    <div>{getBarrelAgeMonths(barrel.entry_date)} months</div>
                    <div>{formatDate(barrel.entry_date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {b.bottle_count && (
          <div className="mt-8 text-sm text-[#c9b48a]">
            {b.bottle_count} bottles produced · {b.yield_gallons}gal yield
          </div>
        )}

        <div className="mt-12 text-xs text-white/20">Powered by Still · Craft Distillery Management</div>
      </div>
    </div>
  )
}
