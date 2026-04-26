import { createServerSupabaseClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { Card } from '@/components/ui/Card'
import { BarrelCard } from '@/components/barrels/BarrelCard'
import { getBarrelAgeMonths } from '@/lib/tags'
import { formatDate } from '@/lib/utils'
import type { Barrel } from '@/types/database'
import Link from 'next/link'

export default async function SuggestionsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const distilleryId = await getMyDistilleryId(supabase, user!.id, getActiveDistilleryId())

  const { data: barrels } = await supabase
    .from('barrels')
    .select('*')
    .eq('distillery_id', distilleryId ?? 'none')
    .in('status', ['aging', 'ready'])
    .order('profile_match_score', { ascending: false })

  const all = (barrels || []) as Barrel[]
  const toTaste = all.slice(0, 5)

  const now = Date.now()
  const approaching = all.filter((b) => {
    if (!b.predicted_peak_date) return false
    const days = (new Date(b.predicted_peak_date).getTime() - now) / (1000 * 60 * 60 * 24)
    return days > 0 && days <= 60
  })

  const pastPeak = all.filter((b) => {
    if (!b.predicted_peak_date) return false
    return new Date(b.predicted_peak_date).getTime() < now
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="font-medium text-lg">AI Suggestions</h1>

      <section>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span className="text-primary">✦</span> Taste this week
        </h2>
        {toTaste.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Log barrels to get tasting suggestions</p>
        ) : (
          <div className="space-y-3">
            {toTaste.map((barrel) => (
              <div key={barrel.id}>
                <BarrelCard barrel={barrel} />
                {barrel.profile_match_score && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 px-1">
                    {barrel.profile_match_score}% match to your profile · {getBarrelAgeMonths(barrel.entry_date)} months old
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {approaching.length > 0 && (
        <section>
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <span className="text-warning">⚡</span> Approaching peak (within 60 days)
          </h2>
          <div className="space-y-3">
            {approaching.map((barrel) => (
              <Link key={barrel.id} href={`/barrels/${barrel.id}`} className="block">
                <Card className="hover:border-warning/40 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{barrel.barrel_number}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{barrel.mash_bill}</div>
                    </div>
                    <div className="text-xs text-warning font-medium">Peak {formatDate(barrel.predicted_peak_date)}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {pastPeak.length > 0 && (
        <section>
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <span className="text-danger">!</span> Past predicted peak
          </h2>
          <div className="space-y-3">
            {pastPeak.map((barrel) => (
              <Link key={barrel.id} href={`/barrels/${barrel.id}`} className="block">
                <Card className="hover:border-danger/40 transition-all border-danger/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{barrel.barrel_number}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{barrel.mash_bill}</div>
                    </div>
                    <div className="text-xs text-danger font-medium">Peaked {formatDate(barrel.predicted_peak_date)}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
