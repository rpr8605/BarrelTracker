import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { BarrelCard, BarrelCardSkeleton } from '@/components/barrels/BarrelCard'
import { SuggestionStrip } from '@/components/ai/SuggestionStrip'
import { StatusBadge } from '@/components/ui/Badge'
import { getBarrelAgeMonths, estimateAngelsShare } from '@/lib/tags'
import { formatCurrency } from '@/lib/utils'
import type { Barrel } from '@/types/database'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: distilleries } = await supabase
    .from('distilleries')
    .select('id')
    .eq('owner_id', user!.id)

  const distilleryIds = (distilleries || []).map((d) => d.id)

  const { data: barrels } = await supabase
    .from('barrels')
    .select('*')
    .in('distillery_id', distilleryIds.length ? distilleryIds : ['none'])
    .order('created_at', { ascending: false })

  const allBarrels = (barrels || []) as Barrel[]
  const ready = allBarrels.filter((b) => b.status === 'ready')
  const aging = allBarrels.filter((b) => b.status === 'aging')

  const avgAgeMonths = allBarrels.length
    ? Math.round(allBarrels.reduce((sum, b) => sum + getBarrelAgeMonths(b.entry_date), 0) / allBarrels.length)
    : 0

  const attention = allBarrels
    .filter((b) => {
      const peak = b.predicted_peak_date ? new Date(b.predicted_peak_date) : null
      const daysUntilPeak = peak ? (peak.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : Infinity
      return b.status === 'ready' || daysUntilPeak <= 60
    })
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{allBarrels.length}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Total barrels</div>
        </Card>
        <Link href="/barrels?status=ready">
          <Card className="hover:border-success/40 transition-all cursor-pointer">
            <div className="text-2xl font-medium text-success">{ready.length}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Ready to bottle</div>
          </Card>
        </Link>
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{avgAgeMonths}mo</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Average age</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">
            {allBarrels.length ? formatCurrency(allBarrels.reduce((s, b) => s + (b.profile_match_score || 0), 0) / allBarrels.length) : '—'}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Est. cost/bottle</div>
        </Card>
      </div>

      <SuggestionStrip barrels={allBarrels} />

      {attention.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text)] mb-3">Needs attention</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attention.map((barrel) => (
              <BarrelCard key={barrel.id} barrel={barrel} />
            ))}
          </div>
        </div>
      )}

      {allBarrels.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⬡</div>
          <h2 className="font-medium text-[var(--color-text)] mb-2">No barrels yet</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Log your first barrel to get started</p>
          <Link href="/barrels/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all min-h-[44px]">
            + Log barrel
          </Link>
        </div>
      )}
    </div>
  )
}
