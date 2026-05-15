import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const db = createServiceClient()
  const { data: staff } = await db.from('staff_members').select('*').eq('distillery_id', distilleryId).order('name')
  const { data: openEntries } = await db.from('time_entries').select('id, staff_member_id, clock_in').eq('distillery_id', distilleryId).is('clock_out', null)

  return NextResponse.json({
    staff: staff || [],
    open_entries: openEntries || [],
  })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const body = await req.json() as { name: string; role?: string; nfc_tag_id?: string; hourly_rate?: number }
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db.from('staff_members').insert({
    distillery_id: distilleryId,
    name: body.name,
    role: body.role || null,
    nfc_tag_id: body.nfc_tag_id || null,
    hourly_rate: body.hourly_rate ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data })
}
