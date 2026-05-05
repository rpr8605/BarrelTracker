import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import type { Trail, ConsumerProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { trailId: string }
}): Promise<Metadata> {
  const db = createServiceClient()
  const { data: trail } = await db.from('trails').select('name').eq('id', params.trailId).single()
  const name = trail?.name ?? 'Whiskey Trail'
  return { title: `${name} — Leaderboard` }
}

interface LeaderboardEntry {
  consumer_id: string
  display_name: string
  avatar_url: string | null
  stops_completed: number
  completed_at: string | null
  passport_id: string
}

export default async function LeaderboardPage({ params }: { params: { trailId: string } }) {
  const db = createServiceClient()

  // Fetch trail
  const { data: trail } = await db
    .from('trails')
    .select('*')
    .eq('id', params.trailId)
    .single()

  if (!trail) notFound()

  const t = trail as Trail

  // Fetch total stops count
  const { count: totalStops } = await db
    .from('trail_stops')
    .select('id', { count: 'exact', head: true })
    .eq('trail_id', params.trailId)

  // Fetch all passports for this trail with consumer profiles
  const { data: passports } = await db
    .from('trail_passports')
    .select('id, consumer_id, completed_at')
    .eq('trail_id', params.trailId)

  if (!passports || passports.length === 0) {
    // No entries yet
    const anon = createServerSupabaseClient()
    const { data: { user } } = await anon.auth.getUser()
    return (
      <EmptyLeaderboard trailId={params.trailId} trailName={t.name} isLoggedIn={!!user} />
    )
  }

  // Fetch checkin counts per passport
  const passportIds = passports.map((p) => p.id)
  const { data: checkinCounts } = await db
    .from('trail_checkins')
    .select('passport_id')
    .in('passport_id', passportIds)

  const countMap: Record<string, number> = {}
  for (const row of checkinCounts ?? []) {
    countMap[row.passport_id] = (countMap[row.passport_id] ?? 0) + 1
  }

  // Fetch consumer profiles
  const consumerIds = Array.from(new Set(passports.map((p) => p.consumer_id)))
  const { data: profilesData } = await db
    .from('consumer_profiles')
    .select('id, display_name, avatar_url')
    .in('id', consumerIds)

  const profileMap: Record<string, Pick<ConsumerProfile, 'display_name' | 'avatar_url'>> = {}
  for (const p of profilesData ?? []) {
    profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }
  }

  // Build leaderboard entries
  const entries: LeaderboardEntry[] = passports
    .map((p) => ({
      consumer_id: p.consumer_id,
      display_name: profileMap[p.consumer_id]?.display_name ?? 'Anonymous',
      avatar_url: profileMap[p.consumer_id]?.avatar_url ?? null,
      stops_completed: countMap[p.id] ?? 0,
      completed_at: p.completed_at,
      passport_id: p.id,
    }))
    .sort((a, b) => {
      // Sort by stops_completed desc, then completed_at asc (faster completion first)
      if (b.stops_completed !== a.stops_completed) return b.stops_completed - a.stops_completed
      if (a.completed_at && b.completed_at) {
        return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      }
      if (a.completed_at) return -1
      if (b.completed_at) return 1
      return 0
    })
    .slice(0, 50)

  // Get current user for highlighting
  const anon = createServerSupabaseClient()
  const { data: { user } } = await anon.auth.getUser()

  let currentConsumerId: string | null = null
  if (user) {
    const { data: myProfile } = await db
      .from('consumer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    currentConsumerId = myProfile?.id ?? null
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Nav */}
      <nav className="border-b border-[var(--color-border)] px-5 py-4 flex items-center gap-3">
        <Link href="/" className="text-[#BA7517] font-semibold tracking-wide text-sm">
          Still
        </Link>
        <span className="text-[var(--color-text-muted)]">/</span>
        <Link
          href={`/trail/${params.trailId}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          {t.name}
        </Link>
        <span className="text-[var(--color-text-muted)]">/</span>
        <span className="text-sm font-medium">Leaderboard</span>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BA7517] to-[#FAC775] flex items-center justify-center text-2xl">
            🏆
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Leaderboard · Top {entries.length} travelers</p>
          </div>
        </div>

        {/* Table */}
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const isCurrentUser = entry.consumer_id === currentConsumerId
            const isComplete = entry.stops_completed >= (totalStops ?? 0) && (totalStops ?? 0) > 0
            const rank = index + 1

            return (
              <div
                key={entry.passport_id}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-colors"
                style={{
                  borderColor: isCurrentUser ? '#BA7517' : 'var(--color-border)',
                  background: isCurrentUser ? 'rgba(186,117,23,0.07)' : 'var(--color-surface)',
                }}
              >
                {/* Rank */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background:
                      rank === 1
                        ? '#FFD700'
                        : rank === 2
                        ? '#C0C0C0'
                        : rank === 3
                        ? '#CD7F32'
                        : 'var(--color-bg-secondary)',
                    color: rank <= 3 ? '#1a1209' : 'var(--color-text-muted)',
                  }}
                >
                  {rank}
                </div>

                {/* Avatar */}
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.display_name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#BA7517]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#BA7517]">
                      {entry.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Name + progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[var(--color-text)] truncate">{entry.display_name}</p>
                    {isCurrentUser && (
                      <span className="text-xs bg-[#BA7517]/15 text-[#BA7517] px-2 py-0.5 rounded-full font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {entry.stops_completed} of {totalStops ?? '?'} stops
                  </p>
                </div>

                {/* Status */}
                {isComplete ? (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-semibold text-[#BA7517] bg-[#BA7517]/10 border border-[#BA7517]/25 px-2 py-0.5 rounded-full">
                      Completed
                    </span>
                    {entry.completed_at && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(entry.completed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex-shrink-0 text-right">
                    <div className="w-20 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#BA7517]"
                        style={{
                          width: `${totalStops ? Math.round((entry.stops_completed / totalStops) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Back link */}
        <Link
          href={`/trail/${params.trailId}`}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors pt-2"
        >
          ← Back to {t.name}
        </Link>
      </div>
    </div>
  )
}

function EmptyLeaderboard({
  trailId,
  trailName,
  isLoggedIn,
}: {
  trailId: string
  trailName: string
  isLoggedIn: boolean
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <nav className="border-b border-[var(--color-border)] px-5 py-4 flex items-center gap-3">
        <Link href="/" className="text-[#BA7517] font-semibold tracking-wide text-sm">
          Still
        </Link>
        <span className="text-[var(--color-text-muted)]">/</span>
        <Link
          href={`/trail/${trailId}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          {trailName}
        </Link>
        <span className="text-[var(--color-text-muted)]">/</span>
        <span className="text-sm font-medium">Leaderboard</span>
      </nav>
      <div className="max-w-2xl mx-auto px-5 py-20 text-center space-y-6">
        <div className="text-5xl">🏆</div>
        <h1 className="text-2xl font-bold">{trailName}</h1>
        <p className="text-[var(--color-text-muted)]">
          No one has started the trail yet. Be the first!
        </p>
        {!isLoggedIn && (
          <Link
            href={`/signup?next=/trail/${trailId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#BA7517] text-white font-semibold text-sm hover:bg-[#854F0B] transition-colors"
          >
            Start your passport
          </Link>
        )}
        <div>
          <Link
            href={`/trail/${trailId}`}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Back to trail
          </Link>
        </div>
      </div>
    </div>
  )
}
