import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcWineGallonsFromBottles, calcProofGallonsFromBottles } from '@/lib/ttb/cbma-calculator'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  let q = admin.from('bottling_records').select('*').eq('distillery_id', distilleryId).order('bottling_date', { ascending: false }).limit(200)
  const from = searchParams.get('from'); const to = searchParams.get('to')
  if (from) q = q.gte('bottling_date', from)
  if (to) q = q.lte('bottling_date', to)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.distillery_id || !body.bottling_date || !body.cases_bottled || !body.proof || !body.bottle_size_ml)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const bpc = body.bottles_per_case ?? 12
  const wg = calcWineGallonsFromBottles(body.cases_bottled, bpc, body.bottle_size_ml)
  const pg = calcProofGallonsFromBottles(body.cases_bottled, bpc, body.bottle_size_ml, body.proof)
  const admin = createServiceClient()
  const { data, error } = await admin.from('bottling_records').insert({
    ...body, bottles_per_case: bpc, wine_gallons: wg, proof_gallons: pg,
    transaction_date: body.transaction_date ?? body.bottling_date,
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
