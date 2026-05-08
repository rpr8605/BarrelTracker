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
  const { data, error } = await admin
    .from('dsp_counterparties')
    .select('*')
    .eq('distillery_id', distilleryId)
    .order('counterparty_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { distillery_id, counterparty_name, dsp_number, address, contact_name, contact_email, contact_phone } = body

  if (!distillery_id || !counterparty_name || !dsp_number) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await admin.from('dsp_counterparties').insert({
    distillery_id, counterparty_name, dsp_number,
    address: address ?? null, contact_name: contact_name ?? null,
    contact_email: contact_email ?? null, contact_phone: contact_phone ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...rest } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createServiceClient()
  const { data: existing } = await admin.from('dsp_counterparties').select('distillery_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', existing.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await admin
    .from('dsp_counterparties')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createServiceClient()
  const { data: existing } = await admin.from('dsp_counterparties').select('distillery_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', existing.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin.from('dsp_counterparties').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
