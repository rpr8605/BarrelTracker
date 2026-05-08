import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcProofGallons, eventSign } from '@/lib/ttb'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const barrelId = searchParams.get('barrel_id')
  const distilleryId = searchParams.get('distillery_id')

  const admin = createServiceClient()
  let query = admin.from('barrel_events').select('*').order('occurred_at', { ascending: false })
  if (barrelId) query = query.eq('barrel_id', barrelId)
  if (distilleryId) query = query.eq('distillery_id', distilleryId)

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { barrel_id, distillery_id, event_type, wine_gallons, proof, notes, occurred_at } = body

  if (!barrel_id || !distillery_id || !event_type || wine_gallons == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const proof_gallons = proof != null ? calcProofGallons(wine_gallons, proof) : null
  const admin = createServiceClient()

  const { data: event, error: evErr } = await admin.from('barrel_events').insert({
    barrel_id,
    distillery_id,
    event_type,
    wine_gallons,
    proof: proof ?? null,
    proof_gallons,
    notes: notes ?? null,
    occurred_at: occurred_at ?? new Date().toISOString(),
    created_by: user.id,
  }).select().single()

  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 })

  // Update current_wine_gallons on the barrel
  const { data: barrel } = await admin.from('barrels').select('current_wine_gallons, wine_gallons').eq('id', barrel_id).single()
  const base = barrel?.current_wine_gallons ?? barrel?.wine_gallons ?? 0
  const delta = wine_gallons * eventSign(event_type)
  const newVolume = Math.max(0, base + delta)

  await admin.from('barrels').update({ current_wine_gallons: newVolume, updated_at: new Date().toISOString() }).eq('id', barrel_id)

  return NextResponse.json(event)
}
