import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import type { Trail, TrailStop, TrailPassport, TrailCheckin, ConsumerProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { trailId: string }
}): Promise<Metadata> {
  const db = createServiceClient()
  const { data: trail } = await db.from('trails').select('name').eq('id', params.trailId).single()
  const name = trail?.name ?? 'Whiskey Trail'
  return {
    title: name,
    openGraph: {
      images: [
        {
          url: `/api/og?type=checkin&trailName=${encodeURIComponent(name)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}

const EXPERIENCE_ICONS: Record<TrailStop['experience_type'], string> = {
  barrel_scan: '🛢️',
  tasting_challenge: '🥃',
  veteran_story: '🎖️',
  cocktail_reveal: '🍊',
}

const EXPERIENCE_LABELS: Record<TrailStop['experience_type'], string> = {
  barrel_scan: 'Barrel Scan',
  tasting_challenge: 'Tasting Challenge',
  veteran_story: 'Veteran Story',
  cocktail_reveal: 'Cocktail Reveal',
}

export default async function TrailPassportPage({ params }: { params: { trailId: string } }) {
  const db = createServiceClient()

  // Fetch trail
  const { data: trail } = await db
    .from('trails')
    .select('*')
    .eq('id', params.trailId)
    .single()

  if (!trail) notFound()

  const t = trail as Trail

  // Fetch stops
  const { data: stopsData } = await db
    .from('trail_stops')
    .select('*')
    .eq('trail_id', params.trailId)
    .order('stop_number', { ascending: true })

  const stops = (stopsData ?? []) as TrailStop[]

  // Auth check (anon client — never throws)
  const anon = createServerSupabaseClient()
  const { data: { user } } = await anon.auth.getUser()

  let profile: ConsumerProfile | null = null
  let passport: TrailPassport | null = null
  let checkins: TrailCheckin[] = []

  if (user) {
    const { data: profileData } = await db
      .from('consumer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    profile = (profileData as ConsumerProfile | null)

    if (profile) {
      const { data: passportData } = await db
        .from('trail_passports')
        .select('*')
        .eq('consumer_id', profile.id)
        .eq('trail_id', params.trailId)
        .single()
      passport = (passportData as TrailPassport | null)

      if (passport) {
        const { data: checkinsData } = await db
          .from('trail_checkins')
          .select('*')
          .eq('passport_id', passport.id)
        checkins = (checkinsData ?? []) as TrailCheckin[]
      }
    }
  }

  const checkedInStopIds = new Set(checkins.map((c) => c.stop_id))
  const progressPct = stops.length > 0 ? Math.round((checkins.length / stops.length) * 100) : 0
  const allComplete = passport?.completed_at != null

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Nav */}
      <nav className="border-b border-[var(--color-border)] px-5 py-4 flex items-center justify-between">
        <Link href="/" className="text-[#BA7517] font-semibold tracking-wide text-sm">
          Still
        </Link>
        {user ? (
          <Link
            href={`/trail/${params.trailId}/leaderboard`}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors font-medium"
          >
            Leaderboard →
          </Link>
        ) : null}
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        {t.logo_url ? (
          <img src={t.logo_url} alt={t.name} className="w-full h-48 object-cover" />
        ) : (
          <div className="h-48 bg-gradient-to-br from-[#854F0B] via-[#BA7517] to-[#FAC775]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎖️</span>
            <span className="text-xs text-white/70 uppercase tracking-widest font-medium">Veterans Whiskey Trail</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{t.name}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-16 space-y-8">
        {/* Description */}
        {t.description && (
          <p className="text-[var(--color-text-muted)] leading-relaxed pt-2">{t.description}</p>
        )}

        {/* Progress bar (authenticated only) */}
        {user && stops.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[var(--color-text)]">Your Progress</span>
              <span className="text-[#BA7517] font-semibold">{checkins.length} / {stops.length} stops</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#BA7517] to-[#FAC775] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Trail complete celebration */}
        {allComplete && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#BA7517]/20 to-[#FAC775]/10 border border-[#BA7517]/40 text-center space-y-2">
            <div className="text-4xl">🎖️</div>
            <h2 className="text-xl font-bold text-[#BA7517]">Trail Complete!</h2>
            <p className="text-[var(--color-text-muted)] text-sm">
              You&apos;ve earned the <span className="font-semibold text-[var(--color-text)]">Trail Complete</span> badge.
              Thank you for your support of veteran distilleries.
            </p>
          </div>
        )}

        {/* Stops list */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
            Trail Stops · {stops.length} locations
          </h2>

          {stops.map((stop) => {
            const isCheckedIn = checkedInStopIds.has(stop.id)
            const checkinUrl = `/checkin/${stop.qr_token}`

            return (
              <Link
                key={stop.id}
                href={checkinUrl}
                className="block rounded-2xl border transition-all hover:border-[#BA7517]/40 active:scale-[0.99]"
                style={{
                  borderColor: isCheckedIn
                    ? 'rgba(186,117,23,0.4)'
                    : 'var(--color-border)',
                  background: isCheckedIn
                    ? 'rgba(186,117,23,0.06)'
                    : 'var(--color-surface)',
                }}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Stop number badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: isCheckedIn ? '#BA7517' : 'var(--color-bg-secondary)',
                      color: isCheckedIn ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    {isCheckedIn ? '✓' : stop.stop_number}
                  </div>

                  {/* Stop info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-text)] truncate">{stop.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {stop.location && (
                        <span className="text-xs text-[var(--color-text-muted)]">{stop.location}</span>
                      )}
                      <span className="text-[var(--color-text-muted)]">·</span>
                      <span className="text-base">{EXPERIENCE_ICONS[stop.experience_type]}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {EXPERIENCE_LABELS[stop.experience_type]}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <span className="text-[var(--color-text-muted)] text-sm flex-shrink-0">→</span>
                </div>

                {/* QR link hint for staff */}
                <div className="px-4 pb-3">
                  <p className="text-xs text-[var(--color-text-muted)]/60 font-mono truncate">
                    still.app{checkinUrl}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Leaderboard link */}
        <Link
          href={`/trail/${params.trailId}/leaderboard`}
          className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] hover:border-[#BA7517]/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div>
              <p className="font-medium text-sm text-[var(--color-text)]">Leaderboard</p>
              <p className="text-xs text-[var(--color-text-muted)]">See who&apos;s leading the trail</p>
            </div>
          </div>
          <span className="text-[var(--color-text-muted)]">→</span>
        </Link>

        {/* Unauthenticated CTA */}
        {!user && (
          <div className="p-6 rounded-2xl border border-[#BA7517]/30 bg-[#BA7517]/5 text-center space-y-4">
            <div className="text-3xl">🎖️</div>
            <div>
              <h3 className="font-bold text-lg text-[var(--color-text)]">Start your passport</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Create a free account to track your stops, earn badges, and join the leaderboard.
              </p>
            </div>
            <Link
              href={`/signup?next=/trail/${params.trailId}`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#BA7517] text-white font-semibold text-sm hover:bg-[#854F0B] transition-colors active:scale-95"
            >
              Sign up free
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
