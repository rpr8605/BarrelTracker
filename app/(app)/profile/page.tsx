import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()

  const { data: profile } = await admin
    .from('taste_profile')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const grain = (profile?.grain_scores || {}) as Record<string, number>
  const flavors = (profile?.flavor_scores || {}) as Record<string, number>
  const topFlavors = Object.entries(flavors).sort((a, b) => b[1] - a[1]).slice(0, 20)
  const grainEntries = Object.entries(grain).sort((a, b) => b[1] - a[1])
  const sweetSpot = (profile?.aging_sweet_spot_months || { min: 24, max: 36 }) as { min: number; max: number }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="font-medium text-lg">Taste Profile</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Built from your voice notes and barrel approvals</p>
      </div>

      {!profile ? (
        <Card className="text-center py-10">
          <div className="text-3xl mb-3">◈</div>
          <p className="font-medium mb-1">Profile not built yet</p>
          <p className="text-sm text-[var(--color-text-muted)]">Record voice notes and mark barrels ready to build your taste profile</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="text-sm font-medium mb-4">Grain preferences</h3>
            <div className="space-y-3">
              {grainEntries.map(([grain, score]) => (
                <div key={grain}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--color-text)]">{grain}</span>
                    <span className="text-primary font-medium">{score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(score, 100)}%` }} />
                  </div>
                </div>
              ))}
              {grainEntries.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)]">No grain data yet</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Aging sweet spot</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-[var(--color-border)] relative">
                <div
                  className="absolute h-full bg-primary/30 rounded-full"
                  style={{ left: `${(sweetSpot.min / 72) * 100}%`, width: `${((sweetSpot.max - sweetSpot.min) / 72) * 100}%` }}
                />
                <div className="absolute h-full w-1 bg-primary rounded-full" style={{ left: `${(sweetSpot.min / 72) * 100}%` }} />
                <div className="absolute h-full w-1 bg-primary rounded-full" style={{ left: `${(sweetSpot.max / 72) * 100}%` }} />
              </div>
              <span className="text-sm text-[var(--color-text)] whitespace-nowrap">{sweetSpot.min}–{sweetSpot.max} months</span>
            </div>
          </Card>

          {topFlavors.length > 0 && (
            <Card>
              <h3 className="text-sm font-medium mb-3">Flavor fingerprint</h3>
              <div className="flex flex-wrap gap-2">
                {topFlavors.map(([flavor, score]) => (
                  <span
                    key={flavor}
                    className="px-2.5 py-1 rounded-full text-white text-xs"
                    style={{
                      backgroundColor: `rgba(186,117,23,${0.3 + (score / 100) * 0.7})`,
                      fontSize: `${Math.max(10, Math.min(16, 10 + score / 10))}px`,
                    }}
                  >
                    {flavor}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Profile stats</h3>
              <span className="text-xs text-[var(--color-text-muted)]">{profile.total_tastings} tastings</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: `${Math.min((profile.total_tastings / 50) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {profile.total_tastings < 10 ? 'Building…' : profile.total_tastings < 25 ? 'Developing' : 'Strong confidence'}
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
