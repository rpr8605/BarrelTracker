import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user }, error: authError } = await auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()

  // Get or create consumer_profile
  let { data: profile } = await db
    .from('consumer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    const { data: newProfile, error: profileError } = await db
      .from('consumer_profiles')
      .insert({ user_id: user.id, display_name: user.email?.split('@')[0] ?? 'Guest' })
      .select('id')
      .single()

    if (profileError || !newProfile) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
    profile = newProfile
  }

  const body = await req.json()
  const { subscription, distillery_id, barrel_id, type } = body as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
    distillery_id?: string
    barrel_id?: string
    type: 'bottling' | 'milestone' | 'drop' | 'release'
  }

  if (!subscription?.endpoint || !subscription?.keys || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error: upsertError } = await db
    .from('notification_subscriptions')
    .upsert(
      {
        consumer_id: profile.id,
        barrel_id: barrel_id ?? null,
        distillery_id: distillery_id ?? null,
        type,
        email: user.email ?? null,
        push_endpoint: JSON.stringify(subscription),
      },
      { onConflict: 'consumer_id,barrel_id,type' }
    )

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }

  return NextResponse.json({ subscribed: true })
}
