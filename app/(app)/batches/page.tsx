import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Batch } from '@/types/database'
import Link from 'next/link'

export default async function BatchesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()

  const distilleryId = await getMyDistilleryId(admin, user!.id, getActiveDistilleryId())

  const { data: batches } = await admin
    .from('batches')
    .select('*')
    .eq('distillery_id', distilleryId ?? 'none')
    .order('created_at', { ascending: false })

  const all = (batches || []) as Batch[]

  return (
    <div className="space-y-4">
      <h1 className="font-medium text-lg">Batches</h1>

      {all.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-3">▣</div>
          <p className="font-medium mb-2">No batches yet</p>
          <p className="text-sm text-[var(--color-text-muted)]">Approve a blend to create your first batch</p>
          <Link href="/blend" className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all min-h-[44px]">
            Go to blending
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {all.map((batch) => (
            <Link key={batch.id} href={`/batches/${batch.id}`} className="block">
              <Card className="hover:border-primary/40 transition-all space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{batch.batch_number || 'Unnamed batch'}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{formatDate(batch.created_at)}</div>
                  </div>
                  <Badge label={batch.story_page_public ? 'Published' : 'Draft'} variant={batch.story_page_public ? 'ready' : 'aging'} />
                </div>
                <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
                  {batch.bottle_count && <span>{batch.bottle_count} bottles</span>}
                  {batch.yield_gallons && <span>{batch.yield_gallons}gal</span>}
                  {batch.cost_per_bottle && <span>{formatCurrency(batch.cost_per_bottle)}/bottle</span>}
                </div>
                {batch.barrel_ids && (
                  <div className="text-xs text-[var(--color-text-muted)]">{batch.barrel_ids.length} barrel{batch.barrel_ids.length !== 1 ? 's' : ''}</div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
