import { createServiceClient } from '@/lib/supabase-server'

export type BadgeTrigger =
  | { type: 'checkin'; stopId: string; passportId: string }
  | { type: 'tasting_note' }
  | { type: 'follow' }
  | { type: 'adoption' }

/**
 * Award a badge to a consumer. Idempotent — does nothing if already awarded.
 * Returns true if newly awarded, false if already had it.
 */
export async function awardBadge(
  consumerId: string,
  badgeSlug: string,
  context?: Record<string, unknown>
): Promise<boolean> {
  const db = createServiceClient()

  const { data: badge } = await db
    .from('badges')
    .select('id')
    .eq('slug', badgeSlug)
    .single()

  if (!badge) return false

  const { error } = await db.from('consumer_badges').insert({
    consumer_id: consumerId,
    badge_id: badge.id,
    context: context ?? {},
    earned_at: new Date().toISOString(),
  })

  // Unique constraint violation = already awarded
  if (error) return false
  return true
}

/**
 * Check and award all badges a consumer may have just earned.
 * Returns slugs of newly awarded badges.
 */
export async function checkAndAwardBadges(
  consumerId: string,
  trigger: BadgeTrigger
): Promise<string[]> {
  const db = createServiceClient()
  const awarded: string[] = []

  if (trigger.type === 'checkin') {
    // Count total checkins across all passports for this consumer
    const { count: totalCheckins } = await db
      .from('trail_checkins')
      .select('id', { count: 'exact', head: true })
      .in(
        'passport_id',
        (
          await db
            .from('trail_passports')
            .select('id')
            .eq('consumer_id', consumerId)
        ).data?.map((p) => p.id) ?? []
      )

    if ((totalCheckins ?? 0) >= 1) {
      const got = await awardBadge(consumerId, 'first_checkin', { trigger: 'checkin' })
      if (got) awarded.push('first_checkin')
    }

    // Check trail-specific completion for Veterans trail
    const { data: passport } = await db
      .from('trail_passports')
      .select('id, trail_id, completed_at')
      .eq('id', trigger.passportId)
      .single()

    if (passport) {
      // Count stops on this trail
      const { count: totalStops } = await db
        .from('trail_stops')
        .select('id', { count: 'exact', head: true })
        .eq('trail_id', passport.trail_id)

      // Count checkins on this passport
      const { count: passportCheckins } = await db
        .from('trail_checkins')
        .select('id', { count: 'exact', head: true })
        .eq('passport_id', passport.id)

      const stops = totalStops ?? 0
      const checkins = passportCheckins ?? 0

      if (stops > 0 && checkins >= stops) {
        const got = await awardBadge(consumerId, 'trail_veterans_complete', {
          trail_id: passport.trail_id,
          passport_id: passport.id,
        })
        if (got) awarded.push('trail_veterans_complete')
      } else if (checkins >= 3) {
        const got = await awardBadge(consumerId, 'trail_veterans_halfway', {
          trail_id: passport.trail_id,
          passport_id: passport.id,
          checkins,
        })
        if (got) awarded.push('trail_veterans_halfway')
      }
    }
  }

  if (trigger.type === 'tasting_note') {
    const { count } = await db
      .from('tasting_notes')
      .select('id', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)

    const n = count ?? 0
    if (n >= 25) {
      const got = await awardBadge(consumerId, 'tasting_25', { count: n })
      if (got) awarded.push('tasting_25')
    } else if (n >= 5) {
      const got = await awardBadge(consumerId, 'tasting_5', { count: n })
      if (got) awarded.push('tasting_5')
    }
  }

  if (trigger.type === 'follow') {
    const { count } = await db
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)

    if ((count ?? 0) >= 3) {
      const got = await awardBadge(consumerId, 'follow_3', { count: count ?? 0 })
      if (got) awarded.push('follow_3')
    }
  }

  if (trigger.type === 'adoption') {
    const { count } = await db
      .from('adoptions')
      .select('id', { count: 'exact', head: true })
      .eq('consumer_id', consumerId)

    if ((count ?? 0) >= 1) {
      const got = await awardBadge(consumerId, 'adoption_first', { count })
      if (got) awarded.push('adoption_first')
    }
  }

  return awarded
}
