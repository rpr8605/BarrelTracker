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
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  let q = admin.from('mash_batches').select('*').eq('distillery_id', distilleryId).order('mash_date', { ascending: false }).limit(200)
  if (from) q = q.gte('mash_date', from)
  if (to) q = q.lte('mash_date', to)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.distillery_id || !body.mash_date || !body.batch_number)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const admin = createServiceClient()
  const totalGrain = body.grains?.reduce((s: number, g: { quantity_lbs: number }) => s + (g.quantity_lbs ?? 0), 0) ?? null
  const { data, error } = await admin.from('mash_batches').insert({
    ...body,
    transaction_date: body.transaction_date ?? new Date().toISOString().split('T')[0],
    total_grain_lbs: totalGrain,
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
