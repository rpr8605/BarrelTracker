import { createServiceClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { AdminStatsCharts } from '@/components/admin/AdminStatsCharts'

export const revalidate = 300

export default async function AdminStatsPage() {
  const db = createServiceClient()

  const [
    { data: distilleries },
    { data: follows },
    { data: sponsorships },
    { data: qrEvents },
    { data: topBarrels },
  ] = await Promise.all([
    db.from('distilleries').select('id, name, plan, created_at').eq('is_demo', false).order('created_at'),
    db.from('follows').select('created_at, entity_type').order('created_at'),
    db.from('sponsorships').select('tier, amount_cents, platform_fee_cents, created_at').eq('status', 'ACTIVE'),
    db.from('barrel_qr_events').select('scanned_at, state, distillery_id').order('scanned_at'),
    db.from('follows')
      .select('entity_id, barrels!follows_entity_id_fkey(barrel_number, distillery_id, distilleries(name))')
      .eq('entity_type', 'barrel'),
  ])

  // Barrel follow counts
  const barrelFollowMap: Record<string, number> = {}
  for (const f of follows?.filter((f) => f.entity_type === 'barrel') ?? []) {
    barrelFollowMap[f.entity_type] = (barrelFollowMap[f.entity_type] ?? 0) + 1
  }

  // Sponsorship by tier
  const tierRevenue: Record<string, number> = {}
  for (const sp of sponsorships ?? []) {
    tierRevenue[sp.tier] = (tierRevenue[sp.tier] ?? 0) + sp.platform_fee_cents
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-[var(--color-text)]">Platform Statistics</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Aggregate data across all tenants</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <div className="text-2xl font-medium">{distilleries?.length ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Total distilleries</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium">{follows?.filter((f) => f.entity_type === 'barrel').length ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Barrel follows</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium">{sponsorships?.length ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Active sponsorships</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium">{qrEvents?.length ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Total QR scans</div>
        </Card>
      </div>

      <AdminStatsCharts
        distilleries={distilleries ?? []}
        follows={follows ?? []}
        sponsorships={sponsorships ?? []}
        qrEvents={qrEvents ?? []}
      />
    </div>
  )
}
