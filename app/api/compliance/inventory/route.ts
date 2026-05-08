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
  const { data, error } = await admin.from('inventory_attestations').select('*').eq('distillery_id', distilleryId).order('inventory_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { distillery_id, inventory_type, period_label, inventory_date, total_proof_gallons, barrel_count, container_count, inventory_data, attested_by_name, attest } = body
  if (!distillery_id || !inventory_type || !period_label || !inventory_date || !attested_by_name)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const admin = createServiceClient()
  const { data, error } = await admin.from('inventory_attestations').insert({
    distillery_id, inventory_type, period_label, inventory_date,
    total_proof_gallons: total_proof_gallons ?? 0,
    barrel_count: barrel_count ?? null, container_count: container_count ?? null,
    inventory_data: inventory_data ?? [],
    attested_by_name,
    attested_by_user_id: user.id,
    attested_at: attest ? new Date().toISOString() : null,
    status: attest ? 'attested' : 'draft',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, attest, ...rest } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const admin = createServiceClient()
  const updates: Record<string, unknown> = { ...rest }
  if (attest) {
    updates.status = 'attested'
    updates.attested_at = new Date().toISOString()
    updates.attested_by_user_id = user.id
  }
  const { data, error } = await admin.from('inventory_attestations').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
