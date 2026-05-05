import { createServiceClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { DemoActions } from '@/components/admin/DemoActions'

export const revalidate = 0

export default async function AdminDemoPage() {
  const db = createServiceClient()

  const { data: demoDistillery } = await db
    .from('distilleries')
    .select('id, name')
    .eq('is_demo', true)
    .eq('slug', 'demo')
    .single()

  const demoId = demoDistillery?.id

  const [
    { count: barrelCount },
    { count: consumerCount },
    { count: sponsorCount },
    { count: scanCount },
    { data: demoTrails },
  ] = await Promise.all([
    demoId
      ? db.from('barrels').select('id', { count: 'exact', head: true }).eq('distillery_id', demoId)
      : Promise.resolve({ count: 0 }),
    demoId
      ? db.from('follows').select('id', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
    demoId
      ? db.from('sponsorships').select('id', { count: 'exact', head: true }).eq('distillery_id', demoId).eq('status', 'ACTIVE')
      : Promise.resolve({ count: 0 }),
    demoId
      ? db.from('barrel_qr_events').select('id', { count: 'exact', head: true }).eq('distillery_id', demoId)
      : Promise.resolve({ count: 0 }),
    demoId
      ? db.from('trails').select('id, name').limit(3)
      : Promise.resolve({ data: [] }),
  ])

  const talkingPoints = [
    `${barrelCount ?? 0} barrels tracked across 3 rickhouses`,
    `${sponsorCount ?? 0} active sponsorships generating revenue`,
    `${consumerCount ?? 0} barrel followers engaged`,
    `${scanCount ?? 0} QR scans tracked over 90 days`,
    '$3,950/mo in active sponsorship revenue',
    '7-stop heritage trail with reward barrel',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-[var(--color-text)]">Demo Environment</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          {demoDistillery ? `Ridgeline Spirits demo is live` : 'Demo not yet seeded'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <div className="text-2xl font-medium">{barrelCount ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Demo barrels</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium">{consumerCount ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Followers</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium text-success">{sponsorCount ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Active sponsors</div>
        </Card>
        <Card>
          <div className="text-2xl font-medium">{scanCount ?? 0}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">QR scans</div>
        </Card>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Pitch Talking Points</h2>
        <ul className="space-y-2">
          {talkingPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
              <span className="text-primary mt-0.5">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <DemoActions demoDistilleryId={demoId ?? null} />
    </div>
  )
}
