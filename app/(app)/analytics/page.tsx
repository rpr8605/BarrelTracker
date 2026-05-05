import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { Card } from '@/components/ui/Card'
import { getBarrelAgeMonths, estimateAngelsShare } from '@/lib/tags'
import type { Barrel } from '@/types/database'

const POSTHOG_CONFIGURED = !!(process.env.NEXT_PUBLIC_POSTHOG_KEY)

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()

  const distilleryId = await getMyDistilleryId(admin, user!.id, getActiveDistilleryId())

  const { data: barrels } = await admin
    .from('barrels')
    .select('*')
    .eq('distillery_id', distilleryId ?? 'none')

  const all = (barrels || []) as Barrel[]

  const byStatus = {
    aging: all.filter(b => b.status === 'aging').length,
    ready: all.filter(b => b.status === 'ready').length,
    bottled: all.filter(b => b.status === 'bottled').length,
    dumped: all.filter(b => b.status === 'dumped').length,
  }

  const avgAngelShare = all.length
    ? all.reduce((sum, b) => sum + estimateAngelsShare(getBarrelAgeMonths(b.entry_date), b.warehouse_tier), 0) / all.length
    : 0

  const allTags = all.flatMap(b => b.tags || [])
  const tagCount = allTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc }, {} as Record<string, number>)
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15)

  const avgAge = all.length
    ? Math.round(all.reduce((sum, b) => sum + getBarrelAgeMonths(b.entry_date), 0) / all.length)
    : 0

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h1 className="font-medium text-lg">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(byStatus).map(([status, count]) => (
          <Card key={status}>
            <div className="text-2xl font-medium">{count}</div>
            <div className="text-xs text-[var(--color-text-muted)] capitalize mt-0.5">{status}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium mb-3">Inventory overview</h3>
          <div className="space-y-2">
            {[
              ['Total barrels', all.length],
              ['Average age', `${avgAge} months`],
              ['Avg angel\'s share', `~${avgAngelShare.toFixed(1)}%`],
              ['Survival rate', all.length ? `${Math.round(((all.length - byStatus.dumped) / all.length) * 100)}%` : '—'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm border-b border-[var(--color-border)] pb-1.5">
                <span className="text-[var(--color-text-muted)]">{label}</span>
                <span className="font-medium text-[var(--color-text)]">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium mb-3">Angel's share by tier</h3>
          {[1, 2, 3, 4, 5].map((tier) => {
            const tierBarrels = all.filter(b => b.warehouse_tier === tier)
            const avg = tierBarrels.length
              ? tierBarrels.reduce((s, b) => s + estimateAngelsShare(getBarrelAgeMonths(b.entry_date), tier), 0) / tierBarrels.length
              : 0
            return tierBarrels.length ? (
              <div key={tier} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--color-text-muted)]">Tier {tier} ({tierBarrels.length} barrels)</span>
                  <span className="text-primary">{avg.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(avg * 4, 100)}%` }} />
                </div>
              </div>
            ) : null
          })}
          {all.every(b => !b.warehouse_tier) && (
            <p className="text-sm text-[var(--color-text-muted)]">Add warehouse tiers to barrels to see this data</p>
          )}
        </Card>
      </div>

      {topTags.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium mb-3">Most common flavors</h3>
          <div className="space-y-2">
            {topTags.map(([tag, count]) => (
              <div key={tag}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--color-text)]">{tag}</span>
                  <span className="text-[var(--color-text-muted)]">{count} barrels</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(count / (topTags[0][1] as number)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PostHog usage analytics card */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium mb-1">Usage Analytics</h3>
            {POSTHOG_CONFIGURED ? (
              <>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Analytics powered by PostHog. Your full dashboard is available at{' '}
                  <a
                    href="https://posthog.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    posthog.com
                  </a>
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Key events tracked: <span className="font-mono text-primary">barrel_viewed</span>,{' '}
                  <span className="font-mono text-primary">trail_checkin</span>,{' '}
                  <span className="font-mono text-primary">distillery_followed</span>,{' '}
                  <span className="font-mono text-primary">$pageview</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--color-text-muted)] mb-2">
                  PostHog is not yet connected. To enable usage analytics, add the following to your{' '}
                  <span className="font-mono text-xs bg-[var(--color-bg-secondary)] px-1 py-0.5 rounded">.env.local</span>:
                </p>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-xs font-mono space-y-1 text-[var(--color-text)]">
                  <div>NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx</div>
                  <div>NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com</div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Get your key at{' '}
                  <a
                    href="https://posthog.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    posthog.com
                  </a>{' '}
                  — free tier supports up to 1 million events/month.
                </p>
              </>
            )}
          </div>
          <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${POSTHOG_CONFIGURED ? 'bg-green-500' : 'bg-yellow-400'}`} />
        </div>
      </Card>
    </div>
  )
}
