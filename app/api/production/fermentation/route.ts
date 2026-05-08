import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  let q = admin.from('fermentation_logs').select('*, mash_batches(batch_number)').eq('distillery_id', distilleryId).order('start_date', { ascending: false }).limit(200)
  const from = searchParams.get('from'); const to = searchParams.get('to')
  if (from) q = q.gte('start_date', from)
  if (to) q = q.lte('start_date', to)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.distillery_id || !body.start_date || !body.fermentation_vessel)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const admin = createServiceClient()
  // Auto-compute ABV if OG + FG provided
  const abv = body.start_og && body.end_fg ? Math.round((body.start_og - body.end_fg) * 131.25 * 100) / 100 : null
  const { data, error } = await admin.from('fermentation_logs').insert({
    ...body,
    transaction_date: body.transaction_date ?? body.start_date,
    estimated_abv: abv,
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...rest } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const admin = createServiceClient()
  const abv = rest.start_og && rest.end_fg ? Math.round((rest.start_og - rest.end_fg) * 131.25 * 100) / 100 : undefined
  const { data, error } = await admin.from('fermentation_logs').update({ ...rest, ...(abv !== undefined ? { estimated_abv: abv } : {}) }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
