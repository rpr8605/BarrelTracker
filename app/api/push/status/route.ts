import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user }, error: authError } = await auth.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()

  const { data: profile } = await db
    .from('consumer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ subscribed: false })
  }

  const { searchParams } = new URL(req.url)
  const distillery_id = searchParams.get('distillery_id')
  const barrel_id = searchParams.get('barrel_id')
  const type = searchParams.get('type')

  if (!type) {
    return NextResponse.json({ error: 'Missing type' }, { status: 400 })
  }

  let query = db
    .from('notification_subscriptions')
    .select('id')
    .eq('consumer_id', profile.id)
    .eq('type', type)

  if (barrel_id) {
    query = query.eq('barrel_id', barrel_id)
  } else if (distillery_id) {
    query = query.eq('distillery_id', distillery_id)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return NextResponse.json({ subscribed: false })
  }

  return NextResponse.json({ subscribed: !!data })
}
