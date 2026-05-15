import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const db = createServiceClient()
  const { data: pref } = await db.from('alert_preferences').select('*').eq('distillery_id', distilleryId).maybeSingle()
  return NextResponse.json({ pref: pref || { email_enabled: true, push_enabled: true, permit_types: ['DSP'] } })
}

export async function PUT(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const body = await req.json() as { email_enabled?: boolean; push_enabled?: boolean; permit_types?: string[] }
  const db = createServiceClient()
  const { data: existing } = await db.from('alert_preferences').select('id').eq('distillery_id', distilleryId).maybeSingle()
  if (existing) {
    await db.from('alert_preferences').update(body).eq('id', existing.id)
  } else {
    await db.from('alert_preferences').insert({ distillery_id: distilleryId, ...body })
  }
  return NextResponse.json({ ok: true })
}
