import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { trackServerEvent } from '@/lib/posthog-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { entityType?: string; entity_type?: string; entityId?: string; entity_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const entityType = body.entityType || body.entity_type
  const entityId = body.entityId || body.entity_id

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 })
  }
  if (!['distillery', 'barrel', 'consumer'].includes(entityType)) {
    return NextResponse.json({ error: 'entityType must be distillery, barrel, or consumer' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Resolve consumer_profile for this user
  let { data: profile } = await admin.from('consumer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!profile) {
    const emailPrefix = user.email?.split('@')[0] || 'User'
    const { data: created } = await admin
      .from('consumer_profiles')
      .insert({ user_id: user.id, display_name: emailPrefix })
      .select('id')
      .single()
    profile = created
  }
  if (!profile) return NextResponse.json({ error: 'Profile error' }, { status: 500 })

  const { data: existing } = await admin
    .from('follows')
    .select('id')
    .eq('consumer_id', profile.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle()

  if (existing) {
    await admin.from('follows').delete().eq('id', existing.id)
    await trackServerEvent(user.id, entityType === 'distillery' ? 'distillery_unfollowed' : 'entity_unfollowed', { entity_id: entityId, entity_type: entityType })
    return NextResponse.json({ following: false })
  }

  const { error } = await admin.from('follows').insert({
    consumer_id: profile.id,
    entity_type: entityType,
    entity_id: entityId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await trackServerEvent(user.id, entityType === 'distillery' ? 'distillery_followed' : 'entity_followed', { entity_id: entityId, entity_type: entityType })
  return NextResponse.json({ following: true })
}
