import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET() {
  const anon = createServerSupabaseClient()
  const { data: { user } } = await anon.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const { data: profile } = await db
    .from('consumer_profiles')
    .select('id, user_id, display_name, avatar_url, bio, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile) return NextResponse.json({ profile })

  // Create a new profile using email prefix as display_name
  const displayName = user.email?.split('@')[0] ?? 'Whiskey Fan'
  const { data: created, error } = await db
    .from('consumer_profiles')
    .insert({
      user_id: user.id,
      display_name: displayName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, user_id, display_name, avatar_url, bio, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: created })
}

export async function PUT(req: NextRequest) {
  const anon = createServerSupabaseClient()
  const { data: { user } } = await anon.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { display_name?: string; bio?: string; avatar_url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { display_name, bio, avatar_url } = body
  if (!display_name?.trim()) {
    return NextResponse.json({ error: 'display_name is required' }, { status: 400 })
  }
  if (bio && bio.length > 200) {
    return NextResponse.json({ error: 'Bio must be 200 characters or fewer' }, { status: 400 })
  }

  const db = createServiceClient()

  // Upsert consumer_profile
  const { data: existing } = await db
    .from('consumer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { data, error } = await db
      .from('consumer_profiles')
      .update({
        display_name: display_name.trim(),
        bio: bio ?? null,
        avatar_url: avatar_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, user_id, display_name, avatar_url, bio')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  }

  const { data, error } = await db
    .from('consumer_profiles')
    .insert({
      user_id: user.id,
      display_name: display_name.trim(),
      bio: bio ?? null,
      avatar_url: avatar_url?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, user_id, display_name, avatar_url, bio')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
