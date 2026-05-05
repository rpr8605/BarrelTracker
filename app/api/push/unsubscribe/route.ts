import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user }, error: authError } = await auth.getUser()
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
    return NextResponse.json({ unsubscribed: true })
  }

  const body = await req.json()
  const { distillery_id, barrel_id, type } = body as {
    distillery_id?: string
    barrel_id?: string
    type: 'bottling' | 'milestone' | 'drop' | 'release'
  }

  if (!type) {
    return NextResponse.json({ error: 'Missing type' }, { status: 400 })
  }

  let query = db
    .from('notification_subscriptions')
    .delete()
    .eq('consumer_id', profile.id)
    .eq('type', type)

  if (barrel_id) {
    query = query.eq('barrel_id', barrel_id)
  } else if (distillery_id) {
    query = query.eq('distillery_id', distillery_id)
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }

  return NextResponse.json({ unsubscribed: true })
}
