import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET() {
  const anon = createServerSupabaseClient()
  const { data: { user } } = await anon.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Get consumer_profile
  const { data: profile } = await db
    .from('consumer_profiles')
    .select('id, display_name, avatar_url, bio')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ adoptions: [], tasting_notes: [], profile: null })
  }

  // Fetch adoptions with barrel + distillery info
  const { data: adoptions } = await db
    .from('adoptions')
    .select(`
      id,
      barrel_id,
      distillery_id,
      bottle_id,
      tier,
      share_number,
      price_paid,
      status,
      adopted_at,
      barrels(barrel_number, grain_type, status, entry_date),
      distilleries(name)
    `)
    .eq('consumer_id', profile.id)
    .order('adopted_at', { ascending: false })

  // Fetch tasting notes with bottle + barrel info
  const { data: tasting_notes } = await db
    .from('tasting_notes')
    .select(`
      id,
      barrel_id,
      bottle_id,
      rating,
      notes,
      flavor_tags,
      created_at,
      bottles(bottle_number, qr_token),
      barrels(barrel_number)
    `)
    .eq('consumer_id', profile.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    adoptions: adoptions ?? [],
    tasting_notes: tasting_notes ?? [],
    profile,
  })
}
