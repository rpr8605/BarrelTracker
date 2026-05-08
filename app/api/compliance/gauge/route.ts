import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcProofGallons } from '@/lib/ttb'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  const barrelId = searchParams.get('barrel_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  let q = admin.from('gauge_records').select('*').eq('distillery_id', distilleryId).order('gauged_at', { ascending: false }).limit(200)
  if (barrelId) q = q.eq('barrel_id', barrelId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { distillery_id, barrel_id, gauge_type, container_id, gauged_at, temperature_f, proof, wine_gallons, gauge_officer, cooperage_code, package_id, gross_weight_lbs, notes } = body
  if (!distillery_id || !gauge_type || !container_id || !gauged_at || temperature_f == null || proof == null || wine_gallons == null || !gauge_officer)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const proof_gallons = calcProofGallons(wine_gallons, proof)
  const admin = createServiceClient()
  const { data, error } = await admin.from('gauge_records').insert({
    distillery_id, barrel_id: barrel_id || null, gauge_type, container_id,
    gauged_at, temperature_f, proof, wine_gallons, proof_gallons, gauge_officer,
    cooperage_code: cooperage_code || null, package_id: package_id || null,
    gross_weight_lbs: gross_weight_lbs || null, notes: notes || null, created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
