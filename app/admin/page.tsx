import { createServiceClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const revalidate = 60

export default async function AdminDashboard() {
  const db = createServiceClient()

  const [
    { count: totalDistilleries },
    { count: totalBarrels },
    { count: totalFollows },
    { count: totalAdoptions },
    { data: activeSubs },
    { data: recentActivity },
    { data: clientHealth },
  ] = await Promise.all([
    db.from('distilleries').select('id', { count: 'exact', head: true }).eq('is_demo', false),
    db.from('barrels').select('id', { count: 'exact', head: true }),
    db.from('follows').select('id', { count: 'exact', head: true }),
    db.from('adoptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('subscriptions').select('plan, status').eq('status', 'active'),
    db.from('barrel_qr_events').select('barrel_id, state, scanned_at, distillery_id').order('scanned_at', { ascending: false }).limit(20),
    db.from('distilleries')
      .select('id, name, created_at, plan, is_demo')
      .eq('is_demo', false)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const planMrr: Record<string, number> = { core: 4900, story: 12900, trail: 29900, pro: 49900 }
  const totalMrr = (activeSubs || []).reduce((s, sub) => s + (planMrr[sub.plan] ?? 0), 0)
  const activeClients = activeSubs?.length ?? 0

  // Sponsorship revenue last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentSponsors } = await db
    .from('sponsorships')
    .select('amount_cents, platform_fee_cents')
    .eq('status', 'ACTIVE')
    .gte('created_at', thirtyDaysAgo)
  const sponsorRevenue = (recentSponsors || []).reduce((s, sp) => s + (sp.platform_fee_cents ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-[var(--color-text)]">Platform Overview</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Live metrics across all tenants</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{formatCurrency(totalMrr / 100)}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Monthly MRR</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{activeClients}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Active clients</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{totalBarrels ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Barrels tracked</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{totalFollows ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Active followers</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-success">{formatCurrency(sponsorRevenue / 100)}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Sponsorship rev (30d)</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text)] mb-3">Recent QR Activity</h2>
          <div className="space-y-2">
            {(recentActivity || []).slice(0, 10).map((ev) => (
              <div key={ev.barrel_id + ev.scanned_at} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] text-sm">
                <span className="text-[var(--color-text-muted)]">Barrel scan</span>
                <span className={
                  ev.state === 'CLAIMED' ? 'text-success' :
                  ev.state === 'TRAIL_COMPLETE' ? 'text-primary' :
                  'text-[var(--color-text-secondary)]'
                }>{ev.state}</span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(ev.scanned_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {(recentActivity || []).length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">No QR scans yet</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-[var(--color-text)] mb-3">Client Health</h2>
          <div className="space-y-2">
            {(clientHealth || []).map((client) => (
              <div key={client.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] text-sm">
                <span className="text-[var(--color-text)] truncate max-w-[140px]">{client.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] uppercase">
                  {client.plan}
                </span>
                <Link href={`/admin/clients?distilleryId=${client.id}`} className="text-xs text-primary hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Link href="/admin/clients" className="card p-4 hover:border-primary/40 transition-all cursor-pointer">
          <div className="text-lg mb-1">◎</div>
          <div className="font-medium text-sm">CRM Pipeline</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Manage prospects and active clients</div>
        </Link>
        <Link href="/admin/stats" className="card p-4 hover:border-primary/40 transition-all cursor-pointer">
          <div className="text-lg mb-1">↗</div>
          <div className="font-medium text-sm">Platform Stats</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Charts, maps, and growth metrics</div>
        </Link>
        <Link href="/admin/demo" className="card p-4 hover:border-primary/40 transition-all cursor-pointer">
          <div className="text-lg mb-1">▣</div>
          <div className="font-medium text-sm">Demo Environment</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Manage demo data for sales pitches</div>
        </Link>
      </div>
    </div>
  )
}
