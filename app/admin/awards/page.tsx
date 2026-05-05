import { createServiceClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { AwardsAdmin } from '@/components/admin/AwardsAdmin'

export const revalidate = 60

const CATEGORIES = [
  'BEST_BOURBON', 'BEST_RYE', 'BEST_SINGLE_MALT', 'BEST_WHEAT', 'BEST_EXPERIMENTAL',
  'MOST_FOLLOWERS', 'TOP_DISTILLERY', 'BEST_STORY', 'BEST_COLLABORATION',
  'COMMUNITY_FAVORITE', 'COLLECTOR_OF_THE_YEAR',
]

export default async function AdminAwardsPage() {
  const db = createServiceClient()
  const currentYear = new Date().getFullYear()

  const { data: awards } = await db
    .from('awards')
    .select('*, award_votes(id, nominee_name)')
    .eq('year', currentYear)
    .order('category')

  const { data: votes } = await db
    .from('award_votes')
    .select('award_id, nominee_name')
    .in('award_id', (awards ?? []).map((a) => a.id))

  // Tally votes per award
  const tallyByAward: Record<string, Record<string, number>> = {}
  for (const vote of votes ?? []) {
    if (!tallyByAward[vote.award_id]) tallyByAward[vote.award_id] = {}
    tallyByAward[vote.award_id][vote.nominee_name] = (tallyByAward[vote.award_id][vote.nominee_name] ?? 0) + 1
  }

  const existingCategories = new Set((awards ?? []).map((a) => a.category))
  const missingCategories = CATEGORIES.filter((c) => !existingCategories.has(c))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[var(--color-text)]">Still Awards {currentYear}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{(awards ?? []).length} of {CATEGORIES.length} categories created</p>
        </div>
        <AwardsAdmin missingCategories={missingCategories} year={currentYear} />
      </div>

      {(awards ?? []).length === 0 && (
        <Card>
          <p className="text-sm text-[var(--color-text-muted)]">No award categories yet. Create the {currentYear} season to get started.</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(awards ?? []).map((award) => {
          const tally = tallyByAward[award.id] ?? {}
          const sorted = Object.entries(tally).sort(([, a], [, b]) => b - a)
          const totalVotes = Object.values(tally).reduce((s, v) => s + v, 0)

          return (
            <Card key={award.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-sm text-[var(--color-text)]">
                    {award.category.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{totalVotes} votes</div>
                </div>
                {award.announced_at && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Announced</span>
                )}
              </div>
              {sorted.slice(0, 5).map(([name, count]) => (
                <div key={name} className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 text-xs text-[var(--color-text)] truncate">{name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] w-6 text-right">{count}</div>
                  <div className="w-24 h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: totalVotes > 0 ? `${(count / totalVotes) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
