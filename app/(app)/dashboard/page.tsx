import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
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
  const admin = createServiceClient()

  const distilleryId = await getMyDistilleryId(admin, user!.id, getActiveDistilleryId())

  const { data: barrels } = await admin
    .from('barrels')
    .select('*')
    .eq('distillery_id', distilleryId ?? 'none')
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

  const barrel8 = allBarrels.find(b => b.barrel_number === '0008')

  return (
    <div className="space-y-6" data-tour="dashboard-overview">
      <div className="flex items-center gap-3">
        <Link href="/search" className="flex-1">
          <div className="bg-muted/50 rounded-lg py-2 px-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)] border border-transparent hover:border-primary/30 transition-all">
            <span>🔍</span>
            <span>Search barrels, batches, or logs...</span>
          </div>
        </Link>
      </div>

      <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3 italic">Demo Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href={barrel8 ? `/barrels/${barrel8.id}` : '/barrels?search=0008'}>
            <Card className="p-3 hover:border-primary transition-all cursor-pointer group h-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⬡</span>
                <p className="font-bold text-sm group-hover:text-primary">View Barrel #0008</p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                See voice notes, sample history, and AI tasting predictions for this demo barrel.
              </p>
            </Card>
          </Link>
          <Link href="/compliance">
            <Card className="p-3 hover:border-primary transition-all cursor-pointer group h-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✓</span>
                <p className="font-bold text-sm group-hover:text-primary">Compliance Center</p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Automated TTB reporting, gauge logs, and excise tax liability tracking.
              </p>
            </Card>
          </Link>
          <Link href={barrel8 ? `/barrel/${barrel8.public_token}` : '/batches'}>
            <Card className="p-3 hover:border-primary transition-all cursor-pointer group h-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✦</span>
                <p className="font-bold text-sm group-hover:text-primary">Preview Story Mode</p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Turn production data into a compelling consumer narrative with AI.
              </p>
            </Card>
          </Link>
        </div>
      </div>

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
