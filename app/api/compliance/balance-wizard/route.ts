import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

// Seed ttb_report_periods from user-entered historical data.
// Used by the manual balance wizard so continuity checks work for distilleries
// joining mid-year or migrating from paper records.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { distillery_id, report_month, production_ending_pg, storage_ending_pg, processing_ending_pg, notes } = body

  if (!distillery_id || !report_month)
    return NextResponse.json({ error: 'Missing distillery_id or report_month' }, { status: 400 })

  const admin = createServiceClient()

  const { data, error } = await admin.from('ttb_report_periods').upsert({
    distillery_id,
    report_month,
    form_5110_40_values: production_ending_pg != null
      ? { line_23_on_hand_end: parseFloat(production_ending_pg), source: 'manual_import', imported_at: new Date().toISOString() }
      : null,
    form_5110_11_values: storage_ending_pg != null
      ? { line_24_on_hand_end: parseFloat(storage_ending_pg), source: 'manual_import', imported_at: new Date().toISOString() }
      : null,
    form_5110_28_values: processing_ending_pg != null
      ? { line_on_hand_end: parseFloat(processing_ending_pg), source: 'manual_import', imported_at: new Date().toISOString() }
      : null,
    status: 'filed',
    notes: notes ?? 'Manually imported historical balance',
  }, { onConflict: 'distillery_id,report_month' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
