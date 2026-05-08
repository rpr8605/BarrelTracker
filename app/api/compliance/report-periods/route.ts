import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { validateMonthlyBalances } from '@/lib/ttb/balance-validator'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  const { data, error } = await admin.from('ttb_report_periods').select('*')
    .eq('distillery_id', distilleryId).order('report_month', { ascending: false }).limit(24)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { distillery_id, report_month, form_5110_40_values, form_5110_11_values, form_5110_28_values, status, confirmation_number, notes } = body
  if (!distillery_id || !report_month) return NextResponse.json({ error: 'Missing distillery_id or report_month' }, { status: 400 })
  const admin = createServiceClient()
  const { data, error } = await admin.from('ttb_report_periods').upsert({
    distillery_id, report_month,
    form_5110_40_values: form_5110_40_values ?? null,
    form_5110_11_values: form_5110_11_values ?? null,
    form_5110_28_values: form_5110_28_values ?? null,
    status: status ?? 'draft',
    filed_at: status === 'filed' ? new Date().toISOString() : null,
    confirmation_number: confirmation_number ?? null,
    notes: notes ?? null,
  }, { onConflict: 'distillery_id,report_month' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  // Balance validation check — called before generating/filing a report
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { distillery_id, report_month } = await req.json()
  if (!distillery_id || !report_month) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const admin = createServiceClient()
  const result = await validateMonthlyBalances(distillery_id, new Date(report_month), admin as Parameters<typeof validateMonthlyBalances>[2])
  return NextResponse.json(result)
}
