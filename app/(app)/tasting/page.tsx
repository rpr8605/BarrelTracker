import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { scoreCategory } from '@/lib/tasting-descriptors'

export default async function TastingIndexPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const distilleryId = getActiveDistilleryId()
  const db = createServiceClient()
  const { data: sessions } = await db
    .from('tasting_sessions')
    .select('id, sampled_at, overall_score, barrel_id, barrels(barrel_number, spirit_type)')
    .eq('distillery_id', distilleryId || '')
    .order('sampled_at', { ascending: false })
    .limit(50)

  type Row = {
    id: string
    sampled_at: string
    overall_score: number | null
    barrel_id: string
    barrels: { barrel_number: string; spirit_type: string } | null
  }
  const rows = (sessions || []) as unknown as Row[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Tasting Log</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="py-2">Date</th>
                <th className="py-2">Barrel</th>
                <th className="py-2">Spirit</th>
                <th className="py-2">Score</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)]/40">
                  <td className="py-2">{new Date(r.sampled_at).toLocaleDateString()}</td>
                  <td className="py-2">{r.barrels?.barrel_number || '—'}</td>
                  <td className="py-2">{r.barrels?.spirit_type || '—'}</td>
                  <td className="py-2">{r.overall_score != null ? `${r.overall_score} · ${scoreCategory(r.overall_score)}` : '—'}</td>
                  <td className="py-2 text-right"><Link href={`/barrels/${r.barrel_id}/tasting`} className="text-primary text-xs">Open →</Link></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-[var(--color-text-muted)]">No tasting sessions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
