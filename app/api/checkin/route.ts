import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { checkAndAwardBadges } from '@/lib/badges'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Auth check
  const anon = createServerSupabaseClient()
  const { data: { user } } = await anon.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { stop_id: string; passport_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { stop_id, passport_id } = body
  if (!stop_id || !passport_id) {
    return NextResponse.json({ error: 'stop_id and passport_id are required' }, { status: 400 })
  }

  const db = createServiceClient()

  // Verify passport belongs to this user
  const { data: passport } = await db
    .from('trail_passports')
    .select('id, trail_id, consumer_id, completed_at')
    .eq('id', passport_id)
    .single()

  if (!passport) {
    return NextResponse.json({ error: 'Passport not found' }, { status: 404 })
  }

  // Verify consumer_profile ownership
  const { data: profile } = await db
    .from('consumer_profiles')
    .select('id')
    .eq('id', passport.consumer_id)
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify stop belongs to same trail
  const { data: stop } = await db
    .from('trail_stops')
    .select('id, trail_id')
    .eq('id', stop_id)
    .eq('trail_id', passport.trail_id)
    .single()

  if (!stop) {
    return NextResponse.json({ error: 'Stop not found on this trail' }, { status: 404 })
  }

  // Upsert the checkin
  const { error: checkinError } = await db.from('trail_checkins').upsert(
    {
      passport_id,
      stop_id,
      checked_in_at: new Date().toISOString(),
      experience_completed: true,
    },
    { onConflict: 'passport_id,stop_id', ignoreDuplicates: true }
  )

  if (checkinError) {
    console.error('checkin upsert error:', checkinError)
    return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
  }

  // Count how many stops are complete
  const { count: totalStops } = await db
    .from('trail_stops')
    .select('id', { count: 'exact', head: true })
    .eq('trail_id', passport.trail_id)

  const { count: completedCheckins } = await db
    .from('trail_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('passport_id', passport_id)

  const allComplete = (completedCheckins ?? 0) >= (totalStops ?? Infinity)

  // Mark passport complete if all stops done
  if (allComplete && !passport.completed_at) {
    await db
      .from('trail_passports')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', passport_id)
  }

  // Award badges
  const badges_earned = await checkAndAwardBadges(passport.consumer_id, {
    type: 'checkin',
    stopId: stop_id,
    passportId: passport_id,
  })

  return NextResponse.json({ success: true, completed: allComplete, badges_earned })
}
