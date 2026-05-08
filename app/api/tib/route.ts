import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { getNextTIBSerial } from '@/lib/ttb/tib-serial'
import { fireTrigger } from '@/lib/ttb/amendment-triggers'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  const barrelId = searchParams.get('barrel_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })

  const admin = createServiceClient()
  let query = admin
    .from('tib_records')
    .select('*')
    .eq('distillery_id', distilleryId)
    .order('transfer_date', { ascending: false })

  if (barrelId) query = query.contains('barrel_ids', [barrelId])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    distillery_id, direction, counterparty_id, counterparty_dsp_number,
    counterparty_name, spirits_type, wine_gallons, proof, transfer_date,
    barrel_ids, container_description, ttb_form_5100_16_serial, notes,
  } = body

  if (!distillery_id || !direction || !counterparty_dsp_number || !counterparty_name ||
      !spirits_type || !wine_gallons || !proof || !transfer_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Verify ownership
  const { data: distillery } = await admin.from('distilleries').select('id,owner_id').eq('id', distillery_id).single()
  if (!distillery || distillery.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const year = new Date(transfer_date).getFullYear()
  const serial_number = await getNextTIBSerial(distillery_id, year, admin)

  const { data, error } = await admin.from('tib_records').insert({
    distillery_id,
    serial_number,
    direction,
    counterparty_id: counterparty_id ?? null,
    counterparty_dsp_number,
    counterparty_name,
    spirits_type,
    wine_gallons,
    proof,
    transfer_date,
    barrel_ids: barrel_ids ?? null,
    container_description: container_description ?? null,
    ttb_form_5100_16_serial: ttb_form_5100_16_serial ?? null,
    notes: notes ?? null,
    status: 'pending',
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire first_tib_inbound trigger on very first inbound TIB for this distillery
  if (direction === 'inbound') {
    const { count } = await admin
      .from('tib_records')
      .select('id', { count: 'exact', head: true })
      .eq('distillery_id', distillery_id)
      .eq('direction', 'inbound')

    if ((count ?? 0) <= 1) {
      await fireTrigger({
        distilleryId: distillery_id,
        alertType: 'first_tib_inbound',
        title: 'First TIB Inbound Transfer — Action Required',
        description: 'Your first inbound Transfer in Bond has been recorded. Ensure your TIB bond is on file with TTB and that a post-TIB gauge record (27 CFR 19.618) is completed within the required timeframe.',
        relatedId: data.id,
        relatedType: 'tib_record',
        severity: 'warning',
        supabase: admin,
      })
    }
  }

  return NextResponse.json(data, { status: 201 })
}
