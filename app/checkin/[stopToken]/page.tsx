import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { CheckInButton } from './CheckInButton'
import { ShareButton } from './ShareButton'
import type { TrailStop, TrailPassport, TrailCheckin, ConsumerProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

const EXPERIENCE_LABELS: Record<TrailStop['experience_type'], string> = {
  barrel_scan: 'Barrel Scan',
  tasting_challenge: 'Tasting Challenge',
  veteran_story: 'Veteran Story',
  cocktail_reveal: 'Cocktail Reveal',
}

const EXPERIENCE_ICONS: Record<TrailStop['experience_type'], string> = {
  barrel_scan: '🛢️',
  tasting_challenge: '🥃',
  veteran_story: '🎖️',
  cocktail_reveal: '🍊',
}

function ExperienceCard({ stop }: { stop: TrailStop }) {
  const config = stop.experience_config as Record<string, unknown>

  if (stop.experience_type === 'veteran_story') {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-[#BA7517]/8 border border-[#BA7517]/20">
          <p className="text-xs font-semibold text-[#BA7517] uppercase tracking-widest mb-2">
            {config.story_title as string}
          </p>
          <p className="text-[var(--color-text)] text-base leading-relaxed">
            {config.prompt as string}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-3">
            Speak with a distillery team member to share your story and complete this stop.
          </p>
        </div>
      </div>
    )
  }

  if (stop.experience_type === 'tasting_challenge') {
    const options = config.answer_options as string[]
    const correct = config.correct as string
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-[#BA7517]/8 border border-[#BA7517]/20">
          <p className="text-xs font-semibold text-[#BA7517] uppercase tracking-widest mb-3">Tasting Challenge</p>
          <p className="text-[var(--color-text)] font-medium mb-4">{config.challenge as string}</p>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <div
                key={opt}
                className={`px-3 py-2 rounded-lg border text-sm text-center ${
                  opt === correct
                    ? 'border-[#BA7517]/50 bg-[#BA7517]/10 text-[#BA7517] font-semibold'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {opt}
                {opt === correct && ' ✓'}
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            The correct answer is revealed above. Ask the distillery staff to verify.
          </p>
        </div>
      </div>
    )
  }

  if (stop.experience_type === 'barrel_scan') {
    return (
      <div className="p-5 rounded-2xl bg-[#BA7517]/8 border border-[#BA7517]/20">
        <p className="text-xs font-semibold text-[#BA7517] uppercase tracking-widest mb-2">Barrel Hunt</p>
        <p className="text-[var(--color-text)] text-base">{config.hint as string}</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-3">
          Find the barrel and show a staff member to complete this stop.
        </p>
      </div>
    )
  }

  if (stop.experience_type === 'cocktail_reveal') {
    return (
      <div className="p-5 rounded-2xl bg-[#BA7517]/8 border border-[#BA7517]/20 space-y-3">
        <p className="text-xs font-semibold text-[#BA7517] uppercase tracking-widest">Signature Cocktail</p>
        <p className="text-lg font-semibold text-[var(--color-text)]">{config.cocktail_name as string}</p>
        <div className="h-px bg-[var(--color-border)]" />
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{config.recipe as string}</p>
      </div>
    )
  }

  return null
}

export default async function CheckinPage({ params }: { params: { stopToken: string } }) {
  const db = createServiceClient()

  // Look up stop by QR token
  const { data: stop } = await db
    .from('trail_stops')
    .select('*')
    .eq('qr_token', params.stopToken)
    .single()

  if (!stop) notFound()

  const s = stop as TrailStop

  // Auth check
  const anon = createServerSupabaseClient()
  const { data: { user } } = await anon.auth.getUser()

  if (!user) {
    redirect(`/signup?next=/checkin/${params.stopToken}`)
  }

  // Get or create consumer_profile
  let profile: ConsumerProfile | null = null
  const { data: existingProfile } = await db
    .from('consumer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (existingProfile) {
    profile = existingProfile as ConsumerProfile
  } else {
    const { data: created } = await db
      .from('consumer_profiles')
      .insert({
        user_id: user.id,
        display_name: user.email?.split('@')[0] ?? 'Traveler',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    profile = created as ConsumerProfile | null
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-muted)]">Unable to load your profile. Please try again.</p>
      </div>
    )
  }

  // Get or create trail_passport
  let passport: TrailPassport | null = null
  const { data: existingPassport } = await db
    .from('trail_passports')
    .select('*')
    .eq('consumer_id', profile.id)
    .eq('trail_id', s.trail_id)
    .single()

  if (existingPassport) {
    passport = existingPassport as TrailPassport
  } else {
    const { data: created } = await db
      .from('trail_passports')
      .insert({
        consumer_id: profile.id,
        trail_id: s.trail_id,
        started_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    passport = created as TrailPassport | null
  }

  if (!passport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-muted)]">Unable to create your passport. Please try again.</p>
      </div>
    )
  }

  // Check if already checked in
  const { data: existingCheckin } = await db
    .from('trail_checkins')
    .select('*')
    .eq('passport_id', passport.id)
    .eq('stop_id', s.id)
    .single()

  const alreadyCheckedIn = !!existingCheckin

  // Get trail info for display
  const { data: trail } = await db
    .from('trails')
    .select('id, name')
    .eq('id', s.trail_id)
    .single()

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Nav */}
      <nav className="border-b border-[var(--color-border)] px-5 py-4 flex items-center gap-3">
        <span className="text-[#BA7517] font-semibold tracking-wide text-sm">Still</span>
        {trail && (
          <>
            <span className="text-[var(--color-text-muted)]">/</span>
            <Link
              href={`/trail/${trail.id}`}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors truncate"
            >
              {trail.name}
            </Link>
          </>
        )}
      </nav>

      <div className="max-w-lg mx-auto px-5 py-10 space-y-8">
        {/* Stop header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-8 h-8 rounded-full bg-[#BA7517] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {s.stop_number}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-medium">
              Stop {s.stop_number}
            </span>
          </div>
          <h1 className="text-2xl font-semibold mt-2">{s.name}</h1>
          {s.location && (
            <p className="text-[var(--color-text-muted)] text-sm mt-1">{s.location}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-base">{EXPERIENCE_ICONS[s.experience_type]}</span>
            <span className="text-xs font-medium text-[#BA7517] uppercase tracking-widest">
              {EXPERIENCE_LABELS[s.experience_type]}
            </span>
          </div>
        </div>

        {/* Experience card */}
        <ExperienceCard stop={s} />

        {/* Check-in section */}
        {alreadyCheckedIn ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-5 rounded-2xl bg-green-900/10 border border-green-700/30">
              <span className="text-3xl">✅</span>
              <div>
                <p className="font-semibold text-green-400">Already stamped!</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                  You checked in here on{' '}
                  {new Date((existingCheckin as TrailCheckin).checked_in_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/trail/${s.trail_id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                View Passport
              </Link>
              <ShareButton stopName={s.name} trailId={s.trail_id} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Complete the experience above, then tap below to stamp your passport.
            </p>
            <CheckInButton stopId={s.id} passportId={passport.id} />
          </div>
        )}

        {/* Back link */}
        {trail && (
          <Link
            href={`/trail/${s.trail_id}`}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Back to {trail.name}
          </Link>
        )}
      </div>
    </div>
  )
}
