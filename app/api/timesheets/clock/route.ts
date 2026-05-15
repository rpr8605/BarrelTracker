import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { staff_member_id?: string; nfc_tag_id?: string; nfc_verified?: boolean }
  const db = createServiceClient()
  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  let staffId = body.staff_member_id
  let nfcVerified = !!body.nfc_verified

  if (!staffId && body.nfc_tag_id) {
    const { data: s } = await db.from('staff_members').select('id').eq('distillery_id', distilleryId).eq('nfc_tag_id', body.nfc_tag_id).eq('is_active', true).maybeSingle()
    if (!s) return NextResponse.json({ error: 'unknown_nfc_tag' }, { status: 404 })
    staffId = s.id
    nfcVerified = true
  }
  if (!staffId) return NextResponse.json({ error: 'missing_staff' }, { status: 400 })

  const { data: staff } = await db.from('staff_members').select('id, name, distillery_id').eq('id', staffId).maybeSingle()
  if (!staff || staff.distillery_id !== distilleryId) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { data: open } = await db.from('time_entries').select('id, clock_in').eq('staff_member_id', staffId).is('clock_out', null).maybeSingle()

  if (open) {
    const { data: updated, error } = await db.from('time_entries').update({ clock_out: new Date().toISOString() }).eq('id', open.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'clock_out', entry: updated, staff_name: staff.name })
  }

  const { data: created, error } = await db.from('time_entries').insert({
    distillery_id: distilleryId,
    staff_member_id: staffId,
    clock_in: new Date().toISOString(),
    nfc_verified: nfcVerified,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: 'clock_in', entry: created, staff_name: staff.name })
}
