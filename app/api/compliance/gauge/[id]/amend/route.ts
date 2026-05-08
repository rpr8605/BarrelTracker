import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcProofGallons } from '@/lib/ttb'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const originalId = params.id

  const { data: original } = await admin.from('gauge_records').select('*').eq('id', originalId).single()
  if (!original) return NextResponse.json({ error: 'Gauge record not found' }, { status: 404 })
  if (original.is_amended) return NextResponse.json({ error: 'Cannot amend an already-amended record' }, { status: 400 })

  const body = await req.json()
  const { wine_gallons, proof, temperature_f, notes, employee_name, employee_title, reason } = body

  if (!reason) return NextResponse.json({ error: 'reason is required when amending a gauge record' }, { status: 400 })

  const wg = wine_gallons ?? original.wine_gallons
  const p = proof ?? original.proof
  const pg = calcProofGallons(wg, p)

  // Mark original as amended (only field update ever allowed)
  await admin.from('gauge_records').update({ is_amended: true }).eq('id', originalId)

  // Create corrected record
  const { data: amended, error } = await admin.from('gauge_records').insert({
    distillery_id: original.distillery_id,
    barrel_id: original.barrel_id,
    gauge_type: original.gauge_type,
    container_id: original.container_id,
    container_type: original.container_type,
    gauge_date: original.gauge_date,
    gauge_time: original.gauge_time,
    transaction_date: original.transaction_date,
    temperature_f: temperature_f ?? original.temperature_f,
    proof: p,
    wine_gallons: wg,
    proof_gallons: pg,
    gross_weight_lbs: original.gross_weight_lbs,
    cooperage_code: original.cooperage_code,
    package_id: original.package_id,
    employee_name: employee_name ?? original.employee_name,
    employee_title: employee_title ?? original.employee_title,
    attested_by: user.id,
    is_amended: false,
    amends_gauge_id: originalId,
    notes: `AMENDMENT of ${originalId}: ${reason}${notes ? ` — ${notes}` : ''}`,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ original_id: originalId, amended_record: amended })
}
