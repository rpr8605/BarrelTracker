import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcProofGallons } from '@/lib/ttb'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  let q = admin.from('distillation_logs').select('*').eq('distillery_id', distilleryId).order('distillation_date', { ascending: false }).limit(200)
  const from = searchParams.get('from'); const to = searchParams.get('to')
  if (from) q = q.gte('distillation_date', from)
  if (to) q = q.lte('distillation_date', to)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.distillery_id || !body.distillation_date || !body.still_id)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const admin = createServiceClient()
  const heartsWG = body.hearts_gallons ?? 0
  const heartsProof = body.hearts_proof ?? 0
  const lwWG = body.low_wines_gallons ?? 0
  const lwProof = body.low_wines_proof ?? 0
  const totalPG = Math.round((calcProofGallons(heartsWG, heartsProof) + calcProofGallons(lwWG, lwProof)) * 10000) / 10000
  const { data, error } = await admin.from('distillation_logs').insert({
    ...body,
    spirits_produced_proof_gallons: totalPG,
    transaction_date: body.transaction_date ?? body.distillation_date,
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
