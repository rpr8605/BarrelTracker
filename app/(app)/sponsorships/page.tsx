import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { cookies } from 'next/headers'

export const revalidate = 0

const TIER_COLOR: Record<string, string> = {
  FOLLOWER: 'text-gray-400',
  SUPPORTER: 'text-blue-400',
  SPONSOR: 'text-yellow-400',
  PARTNER: 'text-primary',
}

export default async function SponsorshipsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  // Support impersonation
  const cookieStore = cookies()
  const viewingAsId = cookieStore.get('viewing_as_distillery_id')?.value
  const distilleryId = viewingAsId ?? await getMyDistilleryId(db, user!.id, getActiveDistilleryId())

  const { data: sponsorships } = await db
    .from('sponsorships')
    .select('id, tier, sponsor_name, sponsor_email, amount_cents, platform_fee_cents, status, created_at, starts_at, ends_at, barrels(barrel_number)')
    .eq('distillery_id', distilleryId ?? 'none')
    .order('created_at', { ascending: false })

  const active = (sponsorships ?? []).filter((s) => s.status === 'ACTIVE')
  const grossRevenue = active.reduce((s, sp) => s + sp.amount_cents, 0)
  const platformFee = active.reduce((s, sp) => s + sp.platform_fee_cents, 0)
  const netRevenue = grossRevenue - platformFee

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-[var(--color-text)]">Barrel Sponsorships</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage your barrel sponsor relationships</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{active.length}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Active sponsors</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-success">{formatCurrency(grossRevenue / 100)}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Gross revenue</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-[var(--color-text)]">{formatCurrency(netRevenue / 100)}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Net (after 10% fee)</div>
        </Card>
      </div>

      {(sponsorships ?? []).length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">✦</div>
          <h2 className="font-medium text-[var(--color-text)] mb-2">No sponsorships yet</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Share your barrel QR codes to start attracting sponsors</p>
        </div>
      )}

      <div className="space-y-2">
        {(sponsorships ?? []).map((sp) => {
          const barrel = sp.barrels as unknown as { barrel_number: string } | null
          return (
            <div key={sp.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[var(--color-text)] truncate">{sp.sponsor_name}</span>
                  <span className={`text-xs font-medium ${TIER_COLOR[sp.tier] ?? ''}`}>{sp.tier}</span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Barrel #{barrel?.barrel_number ?? '?'} · {new Date(sp.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className={`text-sm font-medium ${sp.status === 'ACTIVE' ? 'text-success' : 'text-[var(--color-text-muted)]'}`}>
                    {sp.status}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">{formatCurrency(sp.amount_cents / 100)}</div>
                </div>
                {sp.sponsor_email && (
                  <a
                    href={`mailto:${sp.sponsor_email}`}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-all"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
