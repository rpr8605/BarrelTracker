import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const staffId = searchParams.get('staff_id')
  const weekStart = searchParams.get('week_start')
  const distilleryId = getActiveDistilleryId()
  if (!weekStart || !distilleryId) return NextResponse.json({ error: 'missing_params' }, { status: 400 })

  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const db = createServiceClient()
  let q = db.from('time_entries')
    .select('id, staff_member_id, clock_in, clock_out, nfc_verified, approved_by, approved_at, staff_members(name, hourly_rate)')
    .eq('distillery_id', distilleryId)
    .gte('clock_in', start.toISOString())
    .lt('clock_in', end.toISOString())
    .order('clock_in', { ascending: false })

  if (staffId) q = q.eq('staff_member_id', staffId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data || [] })
}
